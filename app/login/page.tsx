'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-dots flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-white text-xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold">TokenPay</h1>
          <p className="text-gray-400 text-sm">Freelancer invoicing without manual entries</p>
        </div>
        <div className="glass rounded-2xl p-8 space-y-4">
          {sent ? (
            <div className="text-center space-y-2 py-4">
              <p className="text-sm font-medium">Check your inbox 📩</p>
              <p className="text-xs text-gray-400">We sent a magic link to {email}. Click it to log in — no password needed.</p>
              <button
                onClick={() => setSent(false)}
                className="text-xs text-gray-400 underline mt-2"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && email && handleSubmit()}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading || !email}
                className="w-full bg-black text-white py-2.5 rounded-xl font-medium text-sm disabled:opacity-40"
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}