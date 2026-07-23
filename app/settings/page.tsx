'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', gst_number: '', pan_number: '' })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      if (profile) setForm({ name: profile.name || '', gst_number: profile.gst_number || '', pan_number: profile.pan_number || '' })
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.from('users').update(form).eq('id', user.id)

    if (error) {
      setError('Could not save: ' + error.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div className="aurora-corner" />

      <nav className="relative z-10 border-b border-white/10 sticky top-0 bg-black/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black text-xs font-mono font-bold">T</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-white">TokenPay</span>
          </div>
          <div className="flex items-center gap-7">
            {[
              { label: 'Projects', path: '/projects' },
              { label: 'Clients', path: '/clients' },
              { label: 'Invoices', path: '/invoices' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="text-sm text-white/50 hover:text-white font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="w-8 h-8 bg-white/10 border border-white/10 rounded-full flex items-center justify-center cursor-pointer ring-2 ring-accent/30">
              <span className="text-xs font-mono font-bold text-white">{user?.email?.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-8 py-10 space-y-6">
        <div className="fade-up">
          <p className="text-white/40 text-sm mb-1">Account</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-white/90">Settings</h1>
        </div>

        {/* Profile */}
        <div className="fade-up-1 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 space-y-4">
          <h2 className="font-semibold text-xs text-white/40 uppercase tracking-widest">Profile</h2>

          <div className="flex items-center gap-4 pb-4 border-b border-white/10">
            <div className="w-14 h-14 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center">
              <span className="text-xl font-mono font-bold text-white">{user?.email?.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-white">{form.name || 'Your Name'}</p>
              <p className="text-sm text-white/40">{user?.email}</p>
            </div>
          </div>

          {[
            { key: 'name', label: 'Full Name', placeholder: 'Chavi Sharma' },
            { key: 'gst_number', label: 'GST Number', placeholder: '29ABCDE1234F1Z5' },
            { key: 'pan_number', label: 'PAN Number', placeholder: 'ABCDE1234F' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium text-white/60 block mb-1.5">{field.label}</label>
              <input
                type="text"
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full border border-white/10 rounded-xl px-4 py-2.5 text-sm bg-white/5 text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>
          ))}

          {error && <p className="text-overdue text-sm">{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="shine btn-press bg-white text-black px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Account info */}
        <div className="fade-up-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 space-y-3">
          <h2 className="font-semibold text-xs text-white/40 uppercase tracking-widest">Account</h2>
          <div className="flex justify-between items-center py-2">
            <div>
              <p className="text-sm font-medium text-white">Email</p>
              <p className="text-xs text-white/40">{user?.email}</p>
            </div>
            <span className="text-xs font-medium text-paid border border-paid/30 bg-paid/10 px-2.5 py-1 rounded-full">Verified</span>
          </div>
        </div>

        {/* Danger zone */}
        <div className="fade-up-3 rounded-2xl border border-overdue/20 bg-overdue/[0.03] backdrop-blur-sm p-6 space-y-3">
          <h2 className="font-semibold text-xs text-overdue uppercase tracking-widest">Danger Zone</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-white">Sign out</p>
              <p className="text-xs text-white/40">Sign out of your TokenPay account</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-press text-sm font-medium text-overdue border border-overdue/30 px-4 py-2 rounded-xl hover:bg-overdue/10 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}