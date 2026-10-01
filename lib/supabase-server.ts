import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server client bound to the logged-in user's cookies (respects RLS).
export async function supabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list) {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}

export async function requireUser() {
  const supabase = await supabaseServer()
  const { data } = await supabase.auth.getUser()
  return { supabase, user: data.user }
}
