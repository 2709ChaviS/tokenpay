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
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('clients').insert({ ...form, freelancer_id: user?.id })
    router.push('/clients')
  }

  const fields = [
    { key: 'name', label: 'Client Name', placeholder: 'Rahul Sharma', required: true },
    { key: 'email', label: 'Email', placeholder: 'rahul@company.com', required: true },
    { key: 'company', label: 'Company', placeholder: 'ABC Pvt Ltd', required: false },
    { key: 'gst_number', label: 'GST Number', placeholder: '29ABCDE1234F1Z5', required: false },
    { key: 'address', label: 'Address', placeholder: 'Mumbai, Maharashtra', required: false },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="text-lg font-bold tracking-tight">TokenPay</span>
        </div>
        <button onClick={() => router.push('/clients')} className="text-sm text-gray-400 hover:text-black transition-colors">
          ← Back to Clients
        </button>
      </nav>

      <div className="max-w-lg mx-auto px-8 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Client</h1>
          <p className="text-gray-400 text-sm mt-1">Client info is saved once and reused across all invoices.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {field.label}
                {!field.required && <span className="text-gray-300 font-normal ml-1">(optional)</span>}
              </label>
              <input
                type="text"
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.email}
              className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-all"
            >
              {loading ? 'Saving...' : 'Save Client'}
            </button>
            <button
              onClick={() => router.push('/clients')}
              className="border border-gray-200 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}