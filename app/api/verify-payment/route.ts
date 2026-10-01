import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { markInvoicePaid } from '@/lib/payments'

export async function POST(request: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentLinkToken } = await request.json().catch(() => ({}))
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentLinkToken) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex')
  const a = Buffer.from(expected), b = Buffer.from(String(razorpay_signature))
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  const admin = supabaseAdmin()
  const { data: invoice } = await admin.from('invoices').select('id, razorpay_order_id').eq('payment_link_token', paymentLinkToken).single()
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  // The signed order must be the one WE created for THIS invoice (blocks paying a cheap order against a big invoice).
  if (invoice.razorpay_order_id !== razorpay_order_id) {
    return NextResponse.json({ error: 'Order does not match invoice' }, { status: 400 })
  }

  await markInvoicePaid(admin, invoice.id, { razorpayPaymentId: razorpay_payment_id })
  return NextResponse.json({ success: true })
}
