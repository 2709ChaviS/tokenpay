'use client'
import { useEffect } from 'react'

// Safety net: if a password-reset link lands on the wrong page (e.g. the home page),
// forward it to /reset-password so it can be handled.
export function RecoveryRedirect() {
  useEffect(() => {
    if (window.location.pathname.startsWith('/reset-password')) return
    const { hash, search } = window.location
    if (hash.includes('type=recovery') && hash.includes('access_token')) {
      window.location.replace('/reset-password' + hash)
      return
    }
    const code = new URLSearchParams(search).get('code')
    if (code) {
      window.location.replace('/auth/callback?next=/reset-password&code=' + encodeURIComponent(code))
    }
  }, [])
  return null
}