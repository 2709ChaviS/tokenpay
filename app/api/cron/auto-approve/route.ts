import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { approveToken } from '@/lib/approval'

// Runs daily (vercel.json). Approves milestones the client ignored for 7 days.
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = supabaseAdmin()
  const { data: due } = await admin.from('tokens').select('id')
    .eq('status', 'submitted').lte('auto_approve_at', new Date().toISOString())
  let approved = 0
  for (const t of due || []) {
    const r = await approveToken(admin, t.id, 'auto')
    if (r.ok) approved++
  }
  return NextResponse.json({ checked: due?.length || 0, approved })
}
