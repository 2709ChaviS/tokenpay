import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ magic_token: string }> }) {
  const { magic_token } = await params

  const { data: session } = await supabaseAdmin
    .from('client_sessions').select('*').eq('magic_token', magic_token).single()

  if (!session) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })

  const { data: token } = await supabaseAdmin
    .from('tokens').select('*').eq('id', session.token_id).single()

  const { data: project } = await supabaseAdmin
    .from('projects').select('*').eq('id', token?.project_id).single()

  return NextResponse.json({ session, token, project })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ magic_token: string }> }) {
  const { magic_token } = await params
  const { action, disputeReason } = await request.json()

  const { data: session } = await supabaseAdmin
    .from('client_sessions').select('*').eq('magic_token', magic_token).single()

  if (!session || session.used_at) {
    return NextResponse.json({ error: 'Invalid or already-used link' }, { status: 400 })
  }

  const { data: token } = await supabaseAdmin
    .from('tokens').select('*').eq('id', session.token_id).single()
  const { data: project } = await supabaseAdmin
    .from('projects').select('*').eq('id', token?.project_id).single()

  if (action === 'approve') {
    await supabaseAdmin.from('tokens').update({
      status: 'approved',
      client_approved_at: new Date().toISOString()
    }).eq('id', token.id)

    await supabaseAdmin.from('invoice_items').insert({
      token_id: token.id,
      project_id: token.project_id,
      freelancer_id: project.freelancer_id,
      client_id: project.client_id,
      amount_inr: token.value_inr,
      gst_amount: token.value_inr * 0.18,
      final_amount: token.value_inr * 1.18,
    })

    await supabaseAdmin.from('client_sessions').update({ used_at: new Date().toISOString() }).eq('id', session.id)
    return NextResponse.json({ status: 'approved' })
  }

  if (action === 'dispute') {
    await supabaseAdmin.from('tokens').update({
      status: 'disputed',
      dispute_reason: disputeReason
    }).eq('id', token.id)
    return NextResponse.json({ status: 'disputed' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}