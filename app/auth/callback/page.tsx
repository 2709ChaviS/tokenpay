'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    })
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