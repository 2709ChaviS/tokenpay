import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { markInvoicePaid } from '@/lib/payments'

// Razorpay Dashboard > Webhooks > URL: https://YOUR-APP/api/webhooks/razorpay
// Events: payment.captured, order.paid. Secret = RAZORPAY_WEBHOOK_SECRET.
// Safety net: marks invoice paid even if the client closes the tab right after paying.
export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })

  const raw = await request.text()
  const sig = request.headers.get('x-razorpay-signature') || ''
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  const a = Buffer.from(expected), b = Buffer.from(sig)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 })
  }

  const evt = JSON.parse(raw)
  if (evt.event !== 'payment.captured' && evt.event !== 'order.paid') return NextResponse.json({ ok: true })

  const payment = evt.payload?.payment?.entity
  const orderId = payment?.order_id || evt.payload?.order?.entity?.id
  if (!orderId) return NextResponse.json({ ok: true })

  const admin = supabaseAdmin()
  const { data: invoice } = await admin.from('invoices').select('id, grand_total').eq('razorpay_order_id', orderId).single()
  if (!invoice) return NextResponse.json({ ok: true })
  if (payment?.amount && payment.amount !== Math.round(Number(invoice.grand_total) * 100)) {
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
  }
  await markInvoicePaid(admin, invoice.id, { razorpayPaymentId: payment?.id })
  return NextResponse.json({ ok: true })
}
