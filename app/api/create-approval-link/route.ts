import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { tokenId } = await request.json()

  const magicToken = crypto.randomUUID()
  const { error } = await supabaseAdmin.from('client_sessions').insert({
    token_id: tokenId,
    magic_token: magicToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ magicToken })
}