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

    // Delete in FK-dependency order: client_sessions -> invoice_items -> tokens -> projects
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

  const templateIcon: Record<string, string> = {
    logo_design: '🎨', website: '🌐', uiux: '✏️', social_media: '📱', custom: '📁'
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
            <div onClick={() => router.push('/settings')} className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all">
              <span className="text-xs font-bold text-white">CH</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10 space-y-6 relative z-10">
        <div className="fade-up flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
            <p className="text-gray-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="shine btn-press bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
          >
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="fade-up-1 glass rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-gray-500 font-medium">No projects yet</p>
            <button onClick={() => router.push('/projects/new')} className="mt-4 shine btn-press bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
              Create Project
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p, i) => (
              <div
                key={p.id}
                className="fade-up card-lift glass rounded-2xl px-5 py-4 flex justify-between items-center group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Left — clickable */}
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => router.push(`/projects/${p.id}`)}
                >
                  <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-xl border border-gray-100 group-hover:scale-110 transition-transform">
                    {templateIcon[p.template_type] || '📁'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.clients?.name} · {p.clients?.email}</p>
                  </div>
                </div>

                {/* Right — status + delete */}
                <div className="flex items-center gap-3">
                  <span className="badge badge-active">{p.status}</span>
                  <span
                    className="text-gray-200 group-hover:text-gray-500 group-hover:translate-x-1 transition-all text-lg cursor-pointer"
                    onClick={() => router.push(`/projects/${p.id}`)}
                  >→</span>

                  {/* Delete button — shows on hover */}
                  <button
                    onClick={() => deleteProject(p.id)}
                    disabled={deleting === p.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity btn-press text-red-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center border border-transparent hover:border-red-100"
                    title="Delete project"
                  >
                    {deleting === p.id ? '...' : '🗑'}
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