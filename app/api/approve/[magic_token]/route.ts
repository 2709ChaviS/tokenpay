import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { approveToken } from '@/lib/approval'
import { gstRateFor } from '@/lib/gst'
import { APP_URL, button, esc, sendEmail, shell } from '@/lib/email'

type Ctx = { params: Promise<{ magic_token: string }> }

async function load(magic: string) {
  const admin = supabaseAdmin()
  const { data: session } = await admin.from('client_sessions').select('*').eq('magic_token', magic).single()
  if (!session) return { error: 'Invalid link', code: 'invalid' as const }
  const { data: token } = await admin.from('tokens').select('*').eq('id', session.token_id).single()
  if (!token) return { error: 'Invalid link', code: 'invalid' as const }
  const { data: project } = await admin.from('projects').select('id, name, freelancer_id').eq('id', token.project_id).single()
  const { data: seller } = await admin.from('users').select('name, business_name, gst_number, email').eq('id', project!.freelancer_id).single()
  const expired = new Date(session.expires_at).getTime() < Date.now()
  return { admin, session, token, project: project!, seller, expired }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { magic_token } = await params
  const r: any = await load(magic_token)
  if (r.error) return NextResponse.json({ error: r.error, code: r.code }, { status: 404 })

  const done = r.token.status !== 'submitted'
  if (!done && (r.session.used_at || r.expired)) {
    return NextResponse.json({ error: r.expired ? 'This link has expired' : 'This link was already used', code: r.expired ? 'expired' : 'used' }, { status: 410 })
  }
  // Only expose what the client needs to see.
  return NextResponse.json({
    token: { name: r.token.name, description: r.token.description, value_inr: r.token.value_inr, status: r.token.status },
    project: { name: r.project.name },
    from: r.seller?.business_name || r.seller?.name || null,
    gstRate: gstRateFor(r.seller?.gst_number),
  })
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const { magic_token } = await params
  const { action, disputeReason } = await request.json().catch(() => ({}))
  const r: any = await load(magic_token)
  if (r.error) return NextResponse.json({ error: r.error }, { status: 404 })
  if (r.session.used_at || r.expired) return NextResponse.json({ error: 'Link expired or already used' }, { status: 410 })
  if (r.token.status !== 'submitted') return NextResponse.json({ error: 'Milestone is not awaiting approval' }, { status: 400 })

  if (action === 'approve') {
    const res = await approveToken(r.admin, r.token.id, 'client')
    if (!res.ok) return NextResponse.json({ error: res.reason }, { status: 409 })
    return NextResponse.json({ status: 'approved' })
  }

  if (action === 'dispute') {
    const reason = String(disputeReason || '').trim().slice(0, 1000)
    if (!reason) return NextResponse.json({ error: 'Please describe the issue' }, { status: 400 })
    await r.admin.from('tokens').update({ status: 'disputed', dispute_reason: reason, auto_approve_at: null }).eq('id', r.token.id)
    await r.admin.from('client_sessions').update({ used_at: new Date().toISOString() }).eq('id', r.session.id)
    await sendEmail(r.seller?.email, `Issue raised on "${r.token.name}"`,
      shell(`<h2>Your client raised an issue</h2><p><b>${esc(r.token.name)}</b> (${esc(r.project.name)})</p>
        <blockquote style="border-left:3px solid #ddd;margin:16px 0;padding-left:12px">${esc(reason)}</blockquote>
        ${button(`${APP_URL}/projects/${r.project.id}`, 'Open project')}`))
    return NextResponse.json({ status: 'disputed' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
