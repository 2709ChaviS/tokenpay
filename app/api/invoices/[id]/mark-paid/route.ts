import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { markInvoicePaid } from '@/lib/payments'

// Freelancer records an offline payment (UPI / bank transfer).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, supabase } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  const { data: inv } = await supabase.from('invoices').select('id').eq('id', id).single()
  if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  await markInvoicePaid(supabaseAdmin(), id, { manual: true })
  return NextResponse.json({ success: true })
}
