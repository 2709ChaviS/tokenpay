'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let done = false

    // The browser client reads the #access_token from the reset link and signs in automatically.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        done = true
        setReady(true)
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { done = true; setReady(true) }
    })
    const t = setTimeout(() => { if (!done) setFailed(true) }, 5000)
    return () => { sub.subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await createClient().auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h1 className="text-xl font-semibold text-white">Set a new password</h1>
        {!ready && !failed && <p className="text-sm text-white/50">Verifying your link…</p>}
        {failed && !ready && (
          <div className="space-y-3">
            <p className="text-sm text-red-400">This reset link is invalid or has expired.</p>
            <Link href="/login" className="block text-center bg-white text-black py-2.5 rounded-xl text-sm font-medium">
              Back to login and request a new link
            </Link>
          </div>
        )}
        {ready && (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white bg-white/5 outline-none"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={loading} className="w-full bg-white text-black py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}