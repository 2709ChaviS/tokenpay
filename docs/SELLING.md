# Selling TokenPay to 2-3 clients

## Offer (keep it simple)

| Item | Suggested |
|------|-----------|
| Setup (your own Vercel + Supabase + their Razorpay) | ₹1,500 - 3,000 one-time |
| Support / small fixes | ₹500 - 1,000 per month, optional |
| Pilot price for first 3 | Say "founding client" price, honest and time-limited |

Free tiers: Vercel Hobby, Supabase free, Resend free (3k mails/mo), Razorpay (2% per txn, paid by customer). Your cost is about zero. Note Vercel Hobby is non-commercial per their terms; if customers pay you, put each on Vercel Pro (customer pays) or host on a free commercial-friendly platform.

## Reddit

Good: r/forhire (offering), r/freelanceIndia, r/IndiaFreelancers, r/smallbusinessindia. Read each sub's rules first; some ban promos. Do not DM-spam.

Post draft:

> **Built a milestone-based invoicing tool for Indian freelancers. Looking for 3 pilot users**
> Problem: chasing clients for "is this approved?" and then hand-making GST invoices.
> What it does: you set milestones with ₹ values → mark one done → client approves from an emailed link (no login) → approved milestones become a GST-correct PDF invoice → client pays by UPI/Razorpay and it marks itself paid.
> GST only added if you have a GSTIN. Auto-approves if client ghosts for 7 days.
> I'm setting it up for 3 freelancers at a small pilot price in return for honest feedback. Demo link + screenshots in comments. DM me if you want in.

## Before first customer

- [ ] Run smoke test in README on a fresh deployment
- [ ] Razorpay in LIVE mode only after test passes
- [ ] Set `NEXT_PUBLIC_SUPPORT_EMAIL`
- [ ] Give customer a 1-page "how to use" (your screenshots in `public/screenshots`)
- [ ] Agree in writing: what's included, no refund after setup, you are not their accountant
- [ ] Turn on Supabase daily backups (Pro) or export invoices monthly
