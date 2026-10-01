-- ONLY for your already-running Supabase project (the one TokenPay uses today).
-- ORDER: run THIS file first (adds missing columns), then run schema.sql second.
-- Fresh customer projects: run only schema.sql.
alter table public.users add column if not exists email text;
alter table public.users add column if not exists business_name text;
alter table public.users add column if not exists address text;
alter table public.users add column if not exists upi_id text;
alter table public.users add column if not exists bank_details text;
alter table public.clients add column if not exists company text;
alter table public.clients add column if not exists address text;
alter table public.invoice_items add column if not exists gst_rate numeric not null default 0;
alter table public.invoices add column if not exists seller jsonb;
alter table public.invoices add column if not exists due_date date default (current_date + 15);
alter table public.invoices add column if not exists payment_status text not null default 'unpaid';
alter table public.invoices add column if not exists payment_link_token text;
update public.invoices set payment_link_token = replace(gen_random_uuid()::text,'-','') where payment_link_token is null;
alter table public.invoices alter column payment_link_token set default replace(gen_random_uuid()::text,'-','');
alter table public.tokens add column if not exists dispute_reason text;
alter table public.tokens add column if not exists auto_approve_at timestamptz;
-- If either of these fails, you have duplicate invoice numbers / items from the old client-side numbering. Fix the dupes, re-run.
create unique index if not exists invoice_items_token_uniq on public.invoice_items(token_id);
create unique index if not exists invoices_number_uniq on public.invoices(freelancer_id, invoice_number);
