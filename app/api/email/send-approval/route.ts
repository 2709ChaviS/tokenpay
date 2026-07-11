import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const { tokenId, clientEmail, clientName, tokenName, projectName, value } = await request.json()

  const supabase = createClient()

  const magicToken = crypto.randomUUID()
  await supabase.from('client_sessions').insert({
    token_id: tokenId,
    magic_token: magicToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  })

  const approvalUrl = process.env.NEXT_PUBLIC_APP_URL + '/approve/' + magicToken

  await resend.emails.send({
    from: 'TokenPay <onboarding@resend.dev>',
    to: 'chavisharma977@gmail.com',
    subject: 'Action needed: Approve ' + tokenName + ' on ' + projectName,
    html: '<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px"><h2>Hi ' + clientName + ',</h2><p>Your freelancer has completed a milestone and needs your approval.</p><div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:24px 0"><p style="margin:0;font-size:13px;color:#666">Milestone</p><p style="margin:4px 0 0;font-size:18px;font-weight:bold">' + tokenName + '</p><p style="margin:8px 0 0;font-size:13px;color:#666">Project: ' + projectName + '</p><p style="margin:4px 0 0;font-size:24px;font-weight:bold">Rs. ' + value + '</p></div><a href="' + approvalUrl + '" style="display:block;background:#000;color:#fff;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px">Review and Approve</a><p style="margin-top:24px;font-size:12px;color:#999">If you do not respond within 7 days, this milestone will be auto-approved.</p></div>'
  })

  return NextResponse.json({ success: true })
}