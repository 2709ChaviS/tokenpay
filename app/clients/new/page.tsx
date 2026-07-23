'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewClientPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', gst_number: '', address: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    setLoading(true)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("Please login again.")
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        ...form,
        freelancer_id: user.id,
      })
      .select()

    console.log("Inserted:", data)
    console.log("Error:", error)

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    router.push("/clients")
  }

  const fields = [
    { key: 'name', label: 'Client Name', placeholder: 'Rahul Sharma', required: true },
    { key: 'email', label: 'Email', placeholder: 'rahul@company.com', required: true },
    { key: 'company', label: 'Company', placeholder: 'ABC Pvt Ltd', required: false },
    { key: 'gst_number', label: 'GST Number', placeholder: '29ABCDE1234F1Z5', required: false },
    { key: 'address', label: 'Address', placeholder: 'Mumbai, Maharashtra', required: false },
  ]

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      <div className="aurora-corner" />

      <nav className="relative z-10 border-b border-white/10 px-8 py-4 flex justify-between items-center sticky top-0 bg-black/70 backdrop-blur-xl">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black text-xs font-mono font-bold">T</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">TokenPay</span>
        </div>
        <button onClick={() => router.push('/clients')} className="text-sm text-white/40 hover:text-white transition-colors">
          ← Back to Clients
        </button>
      </nav>

      <div className="relative z-10 max-w-lg mx-auto px-8 py-10 space-y-6">
        <div className="fade-up">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white/90">Add Client</h1>
          <p className="text-white/40 text-sm mt-1">Client info is saved once and reused across all invoices.</p>
        </div>

        <div className="fade-up-1 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium text-white/60 block mb-1.5">
                {field.label}
                {!field.required && <span className="text-white/25 font-normal ml-1">(optional)</span>}
              </label>
              <input
                type="text"
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full border border-white/10 rounded-xl px-4 py-2.5 text-sm bg-white/5 text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.email}
              className="shine btn-press bg-white text-black px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-white/90 disabled:opacity-40 transition-all"
            >
              {loading ? 'Saving…' : 'Save Client'}
            </button>
            <button
              onClick={() => router.push('/clients')}
              className="border border-white/10 px-6 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}