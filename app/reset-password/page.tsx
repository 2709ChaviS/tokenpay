'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h1 className="text-xl font-semibold text-white">Set a new password</h1>
        <input
          type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white bg-white/5 outline-none"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="w-full bg-white text-black py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </main>
  )
}
