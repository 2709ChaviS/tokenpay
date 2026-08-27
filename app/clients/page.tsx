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
    <main className="relative min-h-screen bg-black overflow-hidden">
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
            <button onClick={() => router.push('/projects')} className="text-sm text-white/50 hover:text-white font-medium transition-colors">Projects</button>
            <button onClick={() => router.push('/clients')} className="text-sm font-medium text-white">Clients</button>
            <button onClick={() => router.push('/invoices')} className="text-sm text-white/50 hover:text-white font-medium transition-colors">Invoices</button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-8 py-10 space-y-6">
        <div className="fade-up flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white/90">Clients</h1>
            <p className="text-white/40 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => router.push('/clients/new')}
            className="shine btn-press bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
          >
            + Add Client
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="fade-up-1 rounded-2xl border border-dashed border-white/15 p-16 text-center">
            <p className="text-white/40 text-sm">No clients yet.</p>
            <button
              onClick={() => router.push('/clients/new')}
              className="mt-4 text-sm font-medium text-accent hover:underline underline-offset-4"
            >
              Add your first client
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <div
                key={c.id}
                className="fade-up card-lift rounded-2xl px-4 sm:px-5 py-3 sm:py-4 border border-white/10 bg-white/[0.03] backdrop-blur-sm flex justify-between items-center hover:border-white/20 transition-colors group gap-2"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                    <span className="font-mono text-xs font-medium text-white/60">
                      {c.name?.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{c.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{c.email} {c.company ? '· ' + c.company : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {c.gst_number && (
                    <span className="font-mono text-xs text-white/40 px-2.5 py-1 rounded-full border border-white/10">
                      GST: {c.gst_number}
                    </span>
                  )}
                  <button
                    onClick={() => deleteClient(c.id)}
                    disabled={deleting === c.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity btn-press text-overdue hover:bg-overdue/10 w-8 h-8 rounded-lg flex items-center justify-center border border-transparent hover:border-overdue/20"
                    title="Delete client"
                  >
                    {deleting === c.id ? '…' : '🗑'}
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