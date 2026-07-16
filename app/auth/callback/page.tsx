'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient()
      
      // Wait for Supabase to process the URL hash/params
      const { data, error } = await supabase.auth.getSession()
      
      if (data.session) {
        router.push('/dashboard')
        return
      }

      // Try exchanging code if present
      const code = searchParams.get('code')
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        })
        if (!error) {
          router.push('/dashboard')
          return
        }
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.push('/dashboard')
          return
        }
      }

      // Wait 2 seconds and check session again
      setTimeout(async () => {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      }, 2000)
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-dots flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Signing you in...</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}