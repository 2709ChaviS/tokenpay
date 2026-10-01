import type { SupabaseClient } from '@supabase/supabase-js'
import { gstRateFor, splitAmount } from '@/lib/gst'
import { APP_URL, button, esc, sendEmail, shell } from '@/lib/email'

const DAY = 24 * 60 * 60 * 1000

// Mark milestone as submitted and create a fresh client link (old unused links die).
export async function submitMilestone(admin: SupabaseClient, tokenId: string) {
  await admin.from('client_sessions').update({ used_at: new Date().toISOString() })
    .eq('token_id', tokenId).is('used_at', null)

  const { error: upErr } = await admin.from('tokens').update({
    status: 'submitted',
    freelancer_approved_at: new Date().toISOString(),
    auto_approve_at: new Date(Date.now() + 7 * DAY).toISOString(),
    dispute_reason: null,
  }).eq('id', tokenId).in('status', ['pending', 'disputed', 'submitted'])
  if (upErr) throw new Error(upErr.message)

  const magicToken = crypto.randomUUID()
  const { error } = await admin.from('client_sessions').insert({
    token_id: tokenId,
    magic_token: magicToken,
    expires_at: new Date(Date.now() + 7 * DAY).toISOString(),
  })
  if (error) throw new Error(error.message)
  return magicToken
}

export async function emailApprovalLink(admin: SupabaseClient, tokenId: string, magicToken: string) {
  const { data: token } = await admin.from('tokens').select('name, value_inr, project_id').eq('id', tokenId).single()
  if (!token) return { ok: false, reason: 'token not found' }
  const { data: project } = await admin.from('projects').select('name, client_id, freelancer_id').eq('id', token.project_id).single()
  if (!project) return { ok: false, reason: 'project not found' }
  const [{ data: client }, { data: seller }] = await Promise.all([
    admin.from('clients').select('name, email').eq('id', project.client_id).single(),
    admin.from('users').select('name, business_name').eq('id', project.freelancer_id).single(),
  ])
  if (!client?.email) return { ok: false, reason: 'client has no email' }
  const from = seller?.business_name || seller?.name || 'Your freelancer'
  const url = `${APP_URL}/approve/${magicToken}`
  return sendEmail(
    client.email,
    `Action needed: approve "${token.name}" on ${project.name}`,
    shell(`<h2>Hi ${esc(client.name)},</h2>
      <p>${esc(from)} has completed a milestone and needs your approval.</p>
      <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:24px 0">
        <p style="margin:0;font-size:13px;color:#666">Milestone</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:bold">${esc(token.name)}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#666">Project: ${esc(project.name)}</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:bold">Rs. ${Number(token.value_inr).toLocaleString('en-IN')}</p>
      </div>${button(url, 'Review and Approve')}
      <p style="margin-top:24px;font-size:12px;color:#999">No login needed. If you do not respond within 7 days, this milestone is auto-approved.</p>`)
  )
}

// Approve once, create exactly one invoice_item. Idempotent.
export async function approveToken(admin: SupabaseClient, tokenId: string, via: 'client' | 'auto') {
  const { data: claimed } = await admin.from('tokens').update({
    status: 'approved',
    client_approved_at: new Date().toISOString(),
  }).eq('id', tokenId).eq('status', 'submitted').select().single()
  if (!claimed) return { ok: false as const, reason: 'not awaiting approval' }

  const { data: project } = await admin.from('projects').select('freelancer_id, client_id, name').eq('id', claimed.project_id).single()
  const { data: seller } = await admin.from('users').select('gst_number, email, name').eq('id', project!.freelancer_id).single()
  const rate = gstRateFor(seller?.gst_number)
  const base = Number(claimed.value_inr)
  const { gst, final } = splitAmount(base, rate)

  const { error } = await admin.from('invoice_items').insert({
    token_id: claimed.id,
    project_id: claimed.project_id,
    freelancer_id: project!.freelancer_id,
    client_id: project!.client_id,
    amount_inr: base,
    gst_rate: rate,
    gst_amount: gst,
    final_amount: final,
  })
  if (error) {
    await admin.from('tokens').update({ status: 'submitted', client_approved_at: null }).eq('id', tokenId)
    return { ok: false as const, reason: error.message }
  }

  await admin.from('client_sessions').update({ used_at: new Date().toISOString() }).eq('token_id', tokenId).is('used_at', null)

  await sendEmail(seller?.email, `Approved: ${claimed.name} (${project!.name})`,
    shell(`<h2>Milestone approved ${via === 'auto' ? '(auto-approved after 7 days)' : ''}</h2>
      <p><b>${esc(claimed.name)}</b> on ${esc(project!.name)} is approved. Rs. ${base.toLocaleString('en-IN')} is ready to invoice.</p>
      ${button(`${APP_URL}/invoices`, 'Generate invoice')}`))
  return { ok: true as const }
}
