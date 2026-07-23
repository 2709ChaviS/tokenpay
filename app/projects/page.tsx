'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: proj } = await supabase
        .from('projects')
        .select('*, clients(name, email)')
        .eq('freelancer_id', data.user.id)
        .order('created_at', { ascending: false })

      if (proj && proj.length > 0) {
        const { data: allTokens } = await supabase
          .from('tokens').select('status, project_id, projects!inner(freelancer_id)')
          .eq('projects.freelancer_id', data.user.id)

        const byProject: Record<string, any[]> = {}
        ;(allTokens || []).forEach((t: any) => {
          if (!byProject[t.project_id]) byProject[t.project_id] = []
          byProject[t.project_id].push(t)
        })
        const toComplete = proj.filter((p: any) =>
          p.status === 'active' &&
          byProject[p.id]?.length > 0 &&
          byProject[p.id].every((t: any) => t.status === 'invoiced' || t.status === 'paid')
        )
        if (toComplete.length > 0) {
          await supabase.from('projects').update({ status: 'completed' }).in('id', toComplete.map((p: any) => p.id))
          toComplete.forEach((p: any) => { p.status = 'completed' })
        }
      }

      setProjects(proj || [])
    })
  }, [])

  async function deleteProject(id: string) {
    if (!confirm('Delete this project? All tokens and invoice records for it will also be deleted.')) return
    setDeleting(id)
    const supabase = createClient()

    const { data: projectTokens } = await supabase.from('tokens').select('id').eq('project_id', id)
    const tokenIds = (projectTokens || []).map((t: any) => t.id)

    if (tokenIds.length > 0) {
      const { error: sessionsErr } = await supabase.from('client_sessions').delete().in('token_id', tokenIds)
      if (sessionsErr) { alert('Could not delete: ' + sessionsErr.message); setDeleting(null); return }
    }

    const { error: itemsErr } = await supabase.from('invoice_items').delete().eq('project_id', id)
    if (itemsErr) { alert('Could not delete: ' + itemsErr.message); setDeleting(null); return }

    const { error: tokensErr } = await supabase.from('tokens').delete().eq('project_id', id)
    if (tokensErr) { alert('Could not delete: ' + tokensErr.message); setDeleting(null); return }

    const { error: projectErr } = await supabase.from('projects').delete().eq('id', id)
    if (projectErr) { alert('Could not delete: ' + projectErr.message); setDeleting(null); return }

    setProjects(projects.filter(p => p.id !== id))
    setDeleting(null)
  }

  const templateLabel: Record<string, string> = {
    logo_design: 'Logo', website: 'Web', uiux: 'UI/UX', social_media: 'Social', custom: 'Custom'
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
            <div
              onClick={() => router.push('/settings')}
              className="w-8 h-8 bg-white/10 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white/20 transition-all"
            >
              <span className="text-xs font-mono font-bold text-white">CH</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-10 space-y-6">
        <div className="fade-up flex justify-between items-center">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-white/90">Projects</h1>
            <p className="text-white/40 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="shine btn-press bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
          >
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="fade-up-1 rounded-2xl border border-dashed border-white/15 p-16 text-center">
            <p className="text-white/50 font-medium">No projects yet</p>
            <button
              onClick={() => router.push('/projects/new')}
              className="mt-4 shine btn-press bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="fade-up card-lift rounded-2xl px-5 py-4 border border-white/10 bg-white/[0.03] backdrop-blur-sm flex justify-between items-center hover:border-white/20 transition-colors group"
              >
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => router.push(`/projects/${p.id}`)}
                >
                  <span className="font-mono text-xs font-medium text-white/40 w-14 shrink-0">
                    {templateLabel[p.template_type] || 'Custom'}
                  </span>
                  <div>
                    <p className="font-medium text-sm text-white">{p.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{p.clients?.name} · {p.clients?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                 <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
  p.status === 'completed'
    ? 'text-paid border-paid/30 bg-paid/10'
    : p.status === 'active'
    ? 'text-pending border-pending/30 bg-pending/10'
    : 'text-white/50 border-white/10'
}`}>
  {p.status}
</span>
                  <span
                    className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all cursor-pointer inline-block"
                    onClick={() => router.push(`/projects/${p.id}`)}
                  >
                    →
                  </span>

                  <button
                    onClick={() => deleteProject(p.id)}
                    disabled={deleting === p.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity btn-press text-overdue hover:bg-overdue/10 w-8 h-8 rounded-lg flex items-center justify-center border border-transparent hover:border-overdue/20"
                    title="Delete project"
                  >
                    {deleting === p.id ? '…' : '🗑'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}