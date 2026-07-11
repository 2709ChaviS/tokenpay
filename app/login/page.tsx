'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Check your email ✉️</h2>
          <p className="text-gray-500">We sent a login link to <strong>{email}</strong></p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow space-y-4 w-full max-w-sm">
        <h1 className="text-2xl font-bold">Login to TokenPay</h1>
        <p className="text-gray-500 text-sm">Enter your email — we'll send a magic link</p>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
        />
        <button
          onClick={handleLogin}
          disabled={loading || !email}
          className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </div>
    </main>
  )
}