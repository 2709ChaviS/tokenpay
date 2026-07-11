'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', gst_number: '', pan_number: '' })
  const [saved, setSaved] = useState(false)
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
    const supabase = createClient()
    await supabase.from('users').update(form).eq('id', user.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-dots relative">
      <nav className="slide-down sticky top-4 z-50 mx-4 mt-4">
        <div className="glass rounded-2xl px-6 py-3 flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="text-base font-bold tracking-tight">TokenPay</span>
          </div>
          <div className="flex items-center gap-7">
            {[{ label: 'Projects', path: '/projects' }, { label: 'Clients', path: '/clients' }, { label: 'Invoices', path: '/invoices' }].map(item => (
              <button key={item.path} onClick={() => router.push(item.path)} className="nav-link text-sm text-gray-500 font-medium pb-0.5">{item.label}</button>
            ))}
            <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full flex items-center justify-center cursor-pointer ring-2 ring-black">
              <span className="text-xs font-bold text-white">{user?.email?.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10 space-y-6 relative z-10">
        <div className="fade-up">
          <p className="text-gray-400 text-sm mb-1">Account</p>
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        </div>

        {/* Profile */}
        <div className="fade-up-1 glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Profile</h2>

          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-600 rounded-2xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">{user?.email?.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold">{form.name || 'Your Name'}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>

          {[
            { key: 'name', label: 'Full Name', placeholder: 'Chavi Sharma' },
            { key: 'gst_number', label: 'GST Number', placeholder: '29ABCDE1234F1Z5' },
            { key: 'pan_number', label: 'PAN Number', placeholder: 'ABCDE1234F' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium text-gray-600 block mb-1.5">{field.label}</label>
              <input
                type="text"
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white/50"
              />
            </div>
          ))}

          <button
            onClick={handleSave}
            className="shine btn-press bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Account info */}
        <div className="fade-up-2 glass rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Account</h2>
          <div className="flex justify-between items-center py-2">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <span className="badge badge-active">Verified</span>
          </div>
        </div>

        {/* Danger zone */}
        <div className="fade-up-3 glass rounded-2xl p-6 space-y-3 border border-red-100">
          <h2 className="font-semibold text-sm text-red-400 uppercase tracking-widest">Danger Zone</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-gray-400">Sign out of your TokenPay account</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-press text-sm font-medium text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}