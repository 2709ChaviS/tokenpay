'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function sendOtp() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    if (error) { setError(error.message); setLoading(false); return }
    setStep('otp')
    setLoading(false)
  }

  async function verifyOtp() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) { setError(error.message); setLoading(false); return }
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
          {step === 'email' ? (
            <>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && email && sendOtp()}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                onClick={sendOtp}
                disabled={loading || !email}
                className="w-full bg-black text-white py-2.5 rounded-xl font-medium text-sm disabled:opacity-40"
              >
                {loading ? 'Sending...' : 'Send login code'}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 text-center">
                6-digit code sent to <span className="font-medium text-black">{email}</span>
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onKeyDown={e => e.key === 'Enter' && otp.length >= 6 && verifyOtp()}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-center tracking-[0.5em] font-mono"
                maxLength={8}
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full bg-black text-white py-2.5 rounded-xl font-medium text-sm disabled:opacity-40"
              >
                {loading ? 'Verifying...' : 'Verify & login'}
              </button>
              <button
                onClick={() => { setStep('email'); setOtp(''); setError('') }}
                className="w-full text-xs text-gray-400 underline"
              >
                Use a different email
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}