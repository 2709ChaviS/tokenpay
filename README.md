# TokenPay

Milestone-based invoicing for freelancers. Freelancer defines milestones ("tokens") → marks one complete → client approves via magic link (no login) → approved milestones roll into a GST-aware invoice → client pays via Razorpay or UPI/bank → status updates automatically.

Stack: Next.js 16, Supabase (auth + Postgres + RLS), Razorpay, Resend, Vercel.

## Setup (one deployment per customer, about 30 min)

| # | Step | Where |
|---|------|-------|
| 1 | Create Supabase project | supabase.com |
| 2 | Paste `supabase/schema.sql` → Run | Supabase > SQL Editor |
| 3 | Auth > URL Configuration: Site URL = your app URL; add `<app url>/auth/callback` to Redirect URLs | Supabase |
| 4 | (Optional) Auth > Providers > Email: turn off "Confirm email" for quick onboarding | Supabase |
| 5 | Razorpay: create API keys (Test first). Add webhook `<app url>/api/webhooks/razorpay`, events `payment.captured` + `order.paid`, copy secret | Razorpay |
| 6 | Resend: verify a sending domain, create API key | resend.com |
| 7 | Import repo into Vercel, add all variables from `.env.example` | Vercel |
| 8 | Deploy. Open `/login`, sign up, fill Settings (name, GSTIN if registered, UPI/bank) | App |
| 9 | Run the smoke test below | App |

`CRON_SECRET` must be set. Vercel sends it to `/api/cron/auto-approve` daily (see `vercel.json`) so milestones ignored for 7 days auto-approve.

## Smoke test (do before handing over)

1. Settings: save name + UPI.
2. Add client (use your own second email). Create project from a template with ₹ values.
3. Mark first milestone complete → client email arrives → approve from phone.
4. Invoices: "Generate invoice" → download PDF, check seller details + GST line.
5. Copy pay link → pay ₹ test amount with Razorpay test card → invoice flips to Paid.
6. Dispute path: submit another milestone, raise an issue, check it shows on the project, hit Resubmit.

## Money rules (built in)

- GST 18% is charged only if the freelancer has a GSTIN in Settings. No GSTIN = no GST, PDF says so.
- Invoice numbers are `INV-YYYY-NNN`, sequential per freelancer.
- Paid invoices and clients with invoices cannot be deleted (accounting trail).
- Payment is verified server-side (signature + order must match the invoice) and by webhook.
- A client link works once, expires in 7 days, and exposes only milestone name, amount and project.

## Important: whose Razorpay account?

Online payments settle into the Razorpay account whose keys are in the env vars. Do NOT run several unrelated customers on one deployment with your own keys: you would be collecting their money. Either (a) one deployment per customer with their own keys (recommended, this README), or (b) leave Razorpay vars empty and let customers use UPI/bank details + "Mark paid". The pay page handles both.

## Local dev

```bash
cp .env.example .env.local   # fill values
npm install
npm run dev
```

## Known limits

- Single currency (INR), single GST rate (18%), no TDS.
- No team seats; one login per deployment/account.
- Demo login is off unless `NEXT_PUBLIC_DEMO_ENABLED=true`.
