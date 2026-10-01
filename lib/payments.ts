import type { SupabaseClient } from '@supabase/supabase-js'
import { APP_URL, button, esc, sendEmail, shell } from '@/lib/email'

export async function markInvoicePaid(
  admin: SupabaseClient,
  invoiceId: string,
  opts: { razorpayPaymentId?: string; manual?: boolean } = {}
) {
  const { data: inv } = await admin.from('invoices').update({
    payment_status: 'paid',
    status: 'paid',
    paid_at: new Date().toISOString(),
    ...(opts.razorpayPaymentId ? { razorpay_payment_id: opts.razorpayPaymentId } : {}),
  }).eq('id', invoiceId).neq('payment_status', 'paid').select().single()

  if (!inv) return { ok: true, already: true }

  const tokenIds = ((inv.items as any[]) || []).map(i => i.token_id).filter(Boolean)
  if (tokenIds.length) await admin.from('tokens').update({ status: 'paid' }).in('id', tokenIds)

  const { data: seller } = await admin.from('users').select('email').eq('id', inv.freelancer_id).single()
  if (!opts.manual) {
    await sendEmail(seller?.email, `Payment received: ${inv.invoice_number}`,
      shell(`<h2>You got paid</h2><p>Invoice <b>${esc(inv.invoice_number)}</b> for Rs. ${Number(inv.grand_total).toLocaleString('en-IN')} was paid online.</p>${button(`${APP_URL}/invoices`, 'View invoices')}`))
  }
  return { ok: true, already: false }
}
