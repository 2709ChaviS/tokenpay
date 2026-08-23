'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { StaggerGroup, StaggerCard } from '@/components/stagger-in'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState({ active: 0, pending: 0, unbilled: 0 })
  const [profileName, setProfileName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)

      const { data: profile } = await supabase.from('users').select('name').eq('id', data.user.id).single()
      setProfileName(profile?.name || '')

      const { data: proj } = await supabase
        .from('projects').select('*, clients(name)')
        .eq('freelancer_id', data.user.id)
        .order('created_at', { ascending: false }).limit(5)

      const { data: tokens } = await supabase
        .from('tokens').select('status, value_inr, project_id, projects!inner(freelancer_id)')
        .eq('projects.freelancer_id', data.user.id)

      if (tokens && proj) {
        const byProject: Record<string, any[]> = {}
        tokens.forEach((t: any) => {
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

      if (tokens) {
        const active = (proj || []).filter((p: any) => p.status === 'active').length
        const pending = tokens.filter(t => t.status === 'submitted').length
        const unbilled = tokens.filter(t => t.status === 'approved').reduce((s, t) => s + (t.value_inr || 0), 0)
        setStats({ active, pending, unbilled })
      }
    })
  }, [])

  if (!user) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-sm text-white/40">Loading…</p>
      </div>
    </div>
  )

  const initials = user.email?.slice(0, 2).toUpperCase()
  const firstName = profileName?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]?.replace(/[0-9]/g, '') || 'there'
  const templateLabel: Record<string, string> = {
    logo_design: 'Logo', website: 'Web', uiux: 'UI/UX', social_media: 'Social', custom: 'Custom'
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div className="aurora-corner" />

      <nav className="relative z-10 border-b border-white/10 sticky top-0 bg-black/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
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
              className="w-8 h-8 bg-white/10 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white/20 transition-all"
              onClick={() => router.push('/settings')}
              title={user.email}
            >
              <span className="text-xs font-mono font-bold text-white">{initials}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-10 space-y-8">

        <div className="fade-up rounded-2xl p-8 border border-white/10 bg-white/[0.03] backdrop-blur-sm flex justify-between items-center">
          <div>
            <p className="text-white/40 text-sm font-medium mb-1">Welcome back</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-white/90 capitalize">
              {firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}
            </h1>
            <p className="text-white/40 text-sm mt-2">Here's what's happening with your projects today.</p>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="shine btn-press bg-white text-black px-6 py-3 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
          >
            + New Project
          </button>
        </div>

        <StaggerGroup className="grid grid-cols-3 gap-5">
          <StaggerCard
            className="card-lift rounded-2xl p-6 border border-white/10 bg-white/[0.03] backdrop-blur-sm cursor-pointer"
            onClick={() => router.push('/projects')}
          >
            <span className="text-xs font-medium text-white/30 tracking-widest uppercase">Projects</span>
            <p className="font-mono text-5xl font-semibold tracking-tight text-white mt-5 mb-1 tabular-nums">{stats.active}</p>
            <p className="text-sm text-white/40">Active projects</p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-1.5">
              <span className="text-xs text-paid font-medium">● Live</span>
              <span className="text-xs text-white/40">and running</span>
            </div>
          </StaggerCard>

          <StaggerCard className="card-lift rounded-2xl p-6 border border-white/10 bg-white/[0.03] backdrop-blur-sm cursor-pointer">
            <span className="text-xs font-medium text-white/30 tracking-widest uppercase">Pending</span>
            <p className="font-mono text-5xl font-semibold tracking-tight text-white mt-5 mb-1 tabular-nums">{stats.pending}</p>
            <p className="text-sm text-white/40">Awaiting client approval</p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-1.5">
              {stats.pending > 0 && <span className="w-1.5 h-1.5 bg-pending rounded-full pulse-dot" />}
              <span className="text-xs text-pending font-medium">
                {stats.pending > 0 ? `${stats.pending} milestone${stats.pending > 1 ? 's' : ''} waiting` : 'All caught up'}
              </span>
            </div>
          </StaggerCard>

          <StaggerCard
            className="card-lift rounded-2xl p-6 border border-accent/20 bg-accent/[0.06] backdrop-blur-sm cursor-pointer"
            onClick={() => router.push('/invoices')}
          >
            <span className="text-xs font-medium text-white/30 tracking-widest uppercase">Unbilled</span>
            <p className="font-mono text-5xl font-semibold tracking-tight text-white mt-5 mb-1 tabular-nums">
              ₹{stats.unbilled.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-white/40">Ready to invoice</p>
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-xs text-accent font-medium">Generate invoice →</span>
            </div>
          </StaggerCard>
        </StaggerGroup>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/projects/new')}
            className="shine btn-press rounded-xl py-3.5 text-sm font-medium text-white border border-white/10 bg-white/[0.03] hover:border-white/20 transition-colors"
          >
            New Project
          </button>
          <button
            onClick={() => router.push('/invoices')}
            className="shine btn-press rounded-xl py-3.5 text-sm font-medium text-white border border-white/10 bg-white/[0.03] hover:border-white/20 transition-colors"
          >
            Generate Invoice
          </button>
          <button
            onClick={() => router.push('/clients/new')}
            className="shine btn-press rounded-xl py-3.5 text-sm font-medium text-white border border-white/10 bg-white/[0.03] hover:border-white/20 transition-colors"
          >
            Add Client
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white/90">Recent Projects</h2>
            <button
              onClick={() => router.push('/projects')}
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              View all →
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
              <p className="text-white/50 font-medium">No projects yet</p>
              <p className="text-white/30 text-xs mt-1 mb-5">Create your first project to get started</p>
              <button
                onClick={() => router.push('/projects/new')}
                className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
              >
                Create Project
              </button>
            </div>
          ) : (
            <StaggerGroup className="space-y-2">
              {projects.map((p) => (
                <StaggerCard
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="card-lift rounded-2xl px-5 py-4 border border-white/10 bg-white/[0.03] backdrop-blur-sm cursor-pointer flex justify-between items-center hover:border-white/20 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-medium text-white/40 w-14 shrink-0">
                      {templateLabel[p.template_type] || 'Custom'}
                    </span>
                    <div>
                      <p className="font-medium text-sm text-white">{p.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{p.clients?.name}</p>
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
                    <span className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all inline-block">
                      →
                    </span>
                  </div>
                </StaggerCard>
              ))}
            </StaggerGroup>
          )}
        </div>
      </div>
    </div>
  )
}