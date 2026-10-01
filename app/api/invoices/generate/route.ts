import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { money } from '@/lib/gst'

export async function POST(request: NextRequest) {
  const { user, supabase } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  const { clientId } = await request.json().catch(() => ({}))
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const admin = supabaseAdmin()
  const { data: items } = await admin.from('invoice_items')
    .select('*, tokens(name), projects(name), clients(name, email, gst_number, address)')
    .eq('freelancer_id', user.id).eq('client_id', clientId)
  if (!items?.length) return NextResponse.json({ error: 'Nothing to invoice for this client' }, { status: 400 })

  const { data: seller } = await admin.from('users')
    .select('name, business_name, gst_number, pan_number, address, upi_id, bank_details, email').eq('id', user.id).single()

  const subtotal = money(items.reduce((s, i: any) => s + Number(i.amount_inr), 0))
  const gstTotal = money(items.reduce((s, i: any) => s + Number(i.gst_amount), 0))
  const grandTotal = money(items.reduce((s, i: any) => s + Number(i.final_amount), 0))

  let invoice: any = null, lastErr = ''
  for (let attempt = 0; attempt < 3 && !invoice; attempt++) {
    const { data: num } = await supabase.rpc('next_invoice_number')
    const { data, error } = await admin.from('invoices').insert({
      invoice_number: num,
      freelancer_id: user.id,
      client_id: clientId,
      items,
      seller,
      subtotal,
      gst_total: gstTotal,
      grand_total: grandTotal,
      status: 'sent',
    }).select().single()
    if (error) lastErr = error.message; else invoice = data
  }
  if (!invoice) return NextResponse.json({ error: lastErr || 'Could not create invoice' }, { status: 500 })

  const itemIds = items.map((i: any) => i.id)
  const tokenIds = items.map((i: any) => i.token_id).filter(Boolean)
  await admin.from('invoice_items').delete().in('id', itemIds)
  if (tokenIds.length) await admin.from('tokens').update({ status: 'invoiced' }).in('id', tokenIds)

  const projectIds = [...new Set(items.map((i: any) => i.project_id).filter(Boolean))] as string[]
  for (const pid of projectIds) {
    const { data: all } = await admin.from('tokens').select('status').eq('project_id', pid)
    if (all?.length && all.every(t => t.status === 'invoiced' || t.status === 'paid')) {
      await admin.from('projects').update({ status: 'completed' }).eq('id', pid)
    }
  }
  return NextResponse.json({ invoice })
}
