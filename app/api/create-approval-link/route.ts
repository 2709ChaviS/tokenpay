import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { emailApprovalLink, submitMilestone } from '@/lib/approval'

// Freelancer marks a milestone complete -> status 'submitted' + fresh client link (+ optional email).
export async function POST(request: NextRequest) {
  const { user, supabase } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { tokenId, sendEmail } = await request.json().catch(() => ({}))
  if (!tokenId) return NextResponse.json({ error: 'tokenId required' }, { status: 400 })

  // RLS: returns a row only if the token belongs to one of this user's projects
  const { data: token } = await supabase.from('tokens').select('id, status').eq('id', tokenId).single()
  if (!token) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
  if (!['pending', 'disputed', 'submitted'].includes(token.status)) {
    return NextResponse.json({ error: 'Milestone already ' + token.status }, { status: 400 })
  }

  try {
    const admin = supabaseAdmin()
    const magicToken = await submitMilestone(admin, tokenId)
    let emailed = false
    let emailNote: string | undefined
    if (sendEmail) {
      const r: any = await emailApprovalLink(admin, tokenId, magicToken)
      emailed = !!r.ok
      emailNote = r.ok ? undefined : r.reason
    }
    return NextResponse.json({ magicToken, emailed, emailNote })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
