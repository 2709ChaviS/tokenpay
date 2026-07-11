'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      const { data: c } = await supabase.from('clients').select('*').eq('freelancer_id', data.user.id)
      setClients(c || [])
    })
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="text-lg font-bold tracking-tight">TokenPay</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/projects')} className="text-sm text-gray-500 hover:text-black transition-colors">Projects</button>
          <button onClick={() => router.push('/clients')} className="text-sm font-medium text-black">Clients</button>
          <button onClick={() => router.push('/invoices')} className="text-sm text-gray-500 hover:text-black transition-colors">Invoices</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-gray-400 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => router.push('/clients/new')}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + Add Client
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <p className="text-3xl mb-3">👤</p>
            <p className="text-gray-400 text-sm">No clients yet.</p>
            <button onClick={() => router.push('/clients/new')} className="mt-4 text-sm font-medium underline underline-offset-4">
              Add your first client
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex justify-between items-center hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-500">{c.name?.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.email} {c.company ? '· ' + c.company : ''}</p>
                  </div>
                </div>
                {c.gst_number && (
                  <span className="text-xs bg-gray-50 text-gray-400 px-3 py-1 rounded-full border border-gray-100">GST: {c.gst_number}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}