import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { emailApprovalLink, submitMilestone } from '@/lib/approval'

// Re-send the approval email to the client's address on file (issues a fresh link).
export async function POST(request: NextRequest) {
  const { user, supabase } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { tokenId } = await request.json().catch(() => ({}))
  const { data: token } = await supabase.from('tokens').select('id, status').eq('id', tokenId).single()
  if (!token) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
  if (token.status !== 'submitted' && token.status !== 'disputed') {
    return NextResponse.json({ error: 'Milestone is not awaiting approval' }, { status: 400 })
  }

  const admin = supabaseAdmin()
  const magicToken = await submitMilestone(admin, tokenId)
  const r: any = await emailApprovalLink(admin, tokenId, magicToken)
  if (!r.ok) return NextResponse.json({ error: r.reason || 'Email failed', magicToken }, { status: 502 })
  return NextResponse.json({ success: true, magicToken })
}
