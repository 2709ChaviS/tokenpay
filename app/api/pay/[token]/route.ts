import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Razorpay from 'razorpay'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('*, clients(name, email)')
    .eq('payment_link_token', token)
    .single()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json({ invoice })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('payment_link_token', token)
    .single()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.payment_status === 'paid') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  }

  const amountInPaise = Math.round(invoice.grand_total * 100)

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: invoice.invoice_number,
  })

  await supabaseAdmin
    .from('invoices')
    .update({ razorpay_order_id: order.id })
    .eq('id', invoice.id)

  return NextResponse.json({
    orderId: order.id,
    amount: amountInPaise,
    keyId: process.env.RAZORPAY_KEY_ID,
    invoiceNumber: invoice.invoice_number,
  })
}