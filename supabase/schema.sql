-- TokenPay schema. Run once in Supabase SQL Editor (safe to re-run).
-- Existing project with old tables? Run supabase/migrate-existing.sql FIRST, then this file.
create extension if not exists pgcrypto;

-- ---------- tables ----------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  business_name text,
  gst_number text,
  pan_number text,
  address text,
  upi_id text,
  bank_details text,
  created_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  email text,
  company text,
  gst_number text,
  address text,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  template_type text,
  status text not null default 'active',
  created_at timestamptz default now()
);

create table if not exists public.tokens (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  value_inr numeric not null default 0 check (value_inr >= 0),
  position int,
  status text not null default 'pending',
  freelancer_approved_at timestamptz,
  auto_approve_at timestamptz,
  client_approved_at timestamptz,
  dispute_reason text,
  created_at timestamptz default now()
);

create table if not exists public.client_sessions (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references public.tokens(id) on delete cascade,
  magic_token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  token_id uuid references public.tokens(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  freelancer_id uuid not null references public.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  amount_inr numeric not null,
  gst_rate numeric not null default 0,
  gst_amount numeric not null default 0,
  final_amount numeric not null,
  created_at timestamptz default now()
);
create unique index if not exists invoice_items_token_uniq on public.invoice_items(token_id);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null,
  freelancer_id uuid not null references public.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  items jsonb,
  seller jsonb,   -- snapshot of freelancer details at invoice time
  subtotal numeric not null default 0,
  gst_total numeric not null default 0,
  grand_total numeric not null default 0,
  status text not null default 'draft',          -- draft | sent | paid | overdue
  payment_status text not null default 'unpaid', -- unpaid | paid
  payment_link_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  razorpay_order_id text,
  razorpay_payment_id text,
  paid_at timestamptz,
  due_date date default (current_date + 15),
  generated_at timestamptz default now(),
  unique (freelancer_id, invoice_number)
);

-- ---------- helpers ----------
-- Sequential per-freelancer invoice number like INV-2026-004 (uses the caller's own id)
create or replace function public.next_invoice_number()
returns text language plpgsql security definer set search_path = public as $$
declare
  yr text := to_char(now() at time zone 'Asia/Kolkata', 'YYYY');
  n int;
begin
  select coalesce(max(substring(invoice_number from '([0-9]+)$')::int), 0) + 1 into n
    from public.invoices
   where freelancer_id = auth.uid() and invoice_number like 'INV-' || yr || '-%';
  return 'INV-' || yr || '-' || lpad(n::text, 3, '0');
end $$;

-- Create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that signed up before the trigger existed
insert into public.users (id, email)
select id, email from auth.users on conflict (id) do nothing;

-- ---------- row level security ----------
alter table public.users          enable row level security;
alter table public.clients        enable row level security;
alter table public.projects       enable row level security;
alter table public.tokens         enable row level security;
alter table public.client_sessions enable row level security;
alter table public.invoice_items  enable row level security;
alter table public.invoices       enable row level security;

drop policy if exists "own profile"  on public.users;
create policy "own profile" on public.users for all
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own clients" on public.clients;
create policy "own clients" on public.clients for all
  using (freelancer_id = auth.uid()) with check (freelancer_id = auth.uid());

drop policy if exists "own projects" on public.projects;
create policy "own projects" on public.projects for all
  using (freelancer_id = auth.uid())
  with check (freelancer_id = auth.uid()
    and exists (select 1 from public.clients c where c.id = client_id and c.freelancer_id = auth.uid()));

drop policy if exists "own tokens" on public.tokens;
create policy "own tokens" on public.tokens for all
  using (exists (select 1 from public.projects p where p.id = project_id and p.freelancer_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.freelancer_id = auth.uid()));

-- client_sessions: no policy on purpose. Only the server (service role) touches it.

drop policy if exists "own invoice items" on public.invoice_items;
create policy "own invoice items" on public.invoice_items for all
  using (freelancer_id = auth.uid()) with check (freelancer_id = auth.uid());

drop policy if exists "own invoices" on public.invoices;
create policy "own invoices" on public.invoices for all
  using (freelancer_id = auth.uid()) with check (freelancer_id = auth.uid());

-- Freelancers may not self-approve or self-pay via the browser:
-- block direct client-side status jumps to approved/paid on tokens.
create or replace function public.guard_token_status()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null  -- browser session (service role has no auth.uid())
     and new.status in ('approved') and old.status is distinct from 'approved' then
    raise exception 'Only the client can approve a milestone';
  end if;
  return new;
end $$;
drop trigger if exists guard_token_status on public.tokens;
create trigger guard_token_status before update on public.tokens
  for each row execute function public.guard_token_status();

create index if not exists idx_projects_freelancer on public.projects(freelancer_id);
create index if not exists idx_tokens_project on public.tokens(project_id);
create index if not exists idx_tokens_autoapprove on public.tokens(status, auto_approve_at);
create index if not exists idx_invoices_freelancer on public.invoices(freelancer_id);
