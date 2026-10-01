import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Ctx = { params: Promise<{ token: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { token } = await params
  const admin = supabaseAdmin()
  const { data: invoice } = await admin.from('invoices')
    .select('invoice_number, grand_total, subtotal, gst_total, payment_status, due_date, freelancer_id, clients(name)')
    .eq('payment_link_token', token).single()
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const { data: seller } = await admin.from('users')
    .select('name, business_name, upi_id, bank_details').eq('id', (invoice as any).freelancer_id).single()

  const { freelancer_id, ...safe } = invoice as any
  return NextResponse.json({
    invoice: safe,
    seller: { name: seller?.business_name || seller?.name, upi_id: seller?.upi_id, bank_details: seller?.bank_details },
    onlinePayments: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  })
}

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { token } = await params
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Online payment is not enabled. Please use the UPI / bank details shown.' }, { status: 503 })
  }
  const admin = supabaseAdmin()
  const { data: invoice } = await admin.from('invoices').select('*').eq('payment_link_token', token).single()
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (invoice.payment_status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 400 })

  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  const amountInPaise = Math.round(Number(invoice.grand_total) * 100)
  try {
    const order = await razorpay.orders.create({ amount: amountInPaise, currency: 'INR', receipt: invoice.invoice_number.slice(0, 40) })
    await admin.from('invoices').update({ razorpay_order_id: order.id }).eq('id', invoice.id)
    return NextResponse.json({ orderId: order.id, amount: amountInPaise, keyId: process.env.RAZORPAY_KEY_ID, invoiceNumber: invoice.invoice_number })
  } catch (e: any) {
    return NextResponse.json({ error: e?.error?.description || 'Could not start payment' }, { status: 502 })
  }
}
