'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
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

  async function deleteClient(id: string) {
    if (!confirm('Delete this client? All their projects, tokens, and invoices will also be deleted.')) return
    setDeleting(id)
    const supabase = createClient()

    const { data: clientProjects } = await supabase.from('projects').select('id').eq('client_id', id)
    const projectIds = (clientProjects || []).map((p: any) => p.id)

    if (projectIds.length > 0) {
      const { data: projectTokens } = await supabase.from('tokens').select('id').in('project_id', projectIds)
      const tokenIds = (projectTokens || []).map((t: any) => t.id)

      if (tokenIds.length > 0) {
        const { error: sessionsErr } = await supabase.from('client_sessions').delete().in('token_id', tokenIds)
        if (sessionsErr) { alert('Could not delete: ' + sessionsErr.message); setDeleting(null); return }
      }
    }

    const { error: itemsErr } = await supabase.from('invoice_items').delete().eq('client_id', id)
    if (itemsErr) { alert('Could not delete: ' + itemsErr.message); setDeleting(null); return }

    const { error: invoicesErr } = await supabase.from('invoices').delete().eq('client_id', id)
    if (invoicesErr) { alert('Could not delete: ' + invoicesErr.message); setDeleting(null); return }

    if (projectIds.length > 0) {
      const { error: tokensErr } = await supabase.from('tokens').delete().in('project_id', projectIds)
      if (tokensErr) { alert('Could not delete: ' + tokensErr.message); setDeleting(null); return }

      const { error: projectsErr } = await supabase.from('projects').delete().eq('client_id', id)
      if (projectsErr) { alert('Could not delete: ' + projectsErr.message); setDeleting(null); return }
    }

    const { error: clientErr } = await supabase.from('clients').delete().eq('id', id)
    if (clientErr) { alert('Could not delete: ' + clientErr.message); setDeleting(null); return }

    setClients(clients.filter(c => c.id !== id))
    setDeleting(null)
  }

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
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex justify-between items-center hover:border-gray-300 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-500">{c.name?.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.email} {c.company ? '· ' + c.company : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {c.gst_number && (
                    <span className="text-xs bg-gray-50 text-gray-400 px-3 py-1 rounded-full border border-gray-100">GST: {c.gst_number}</span>
                  )}
                  <button
                    onClick={() => deleteClient(c.id)}
                    disabled={deleting === c.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center border border-transparent hover:border-red-100"
                    title="Delete client"
                  >
                    {deleting === c.id ? '...' : '🗑'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}