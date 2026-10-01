import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _admin: SupabaseClient<any, 'public', any> | null = null

// Server-only. Never import from a 'use client' file.
export function supabaseAdmin(): SupabaseClient<any, 'public', any> {
  if (!_admin) {
    _admin = createClient<any, 'public', any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
  }
  return _admin
}
