'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) { setError(loginError.message); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push('/dashboard')
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
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button onClick={() => setMode('login')} className={'flex-1 py-1.5 rounded-lg text-sm font-medium ' + (mode === 'login' ? 'bg-white shadow-sm' : 'text-gray-500')}>Login</button>
            <button onClick={() => setMode('signup')} className={'flex-1 py-1.5 rounded-lg text-sm font-medium ' + (mode === 'signup' ? 'bg-white shadow-sm' : 'text-gray-500')}>Sign up</button>
          </div>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-black text-white py-2.5 rounded-xl font-medium text-sm disabled:opacity-40"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </div>
      </div>
    </main>
  )
}