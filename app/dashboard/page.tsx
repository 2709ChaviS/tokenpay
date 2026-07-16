'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState({ active: 0, pending: 0, unbilled: 0 })
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      const { data: proj } = await supabase
        .from('projects').select('*, clients(name)')
        .eq('freelancer_id', data.user.id)
        .order('created_at', { ascending: false }).limit(5)
      setProjects(proj || [])
      const { data: tokens } = await supabase
        .from('tokens').select('status, value_inr, projects!inner(freelancer_id)')
        .eq('projects.freelancer_id', data.user.id)
      if (tokens) {
        const active = (proj || []).filter((p: any) => p.status === 'active').length
        const pending = tokens.filter(t => t.status === 'submitted').length
        const unbilled = tokens.filter(t => t.status === 'approved').reduce((s, t) => s + (t.value_inr || 0), 0)
        setStats({ active, pending, unbilled })
      }
    })
  }, [])

  if (!user) return (
    <div className="min-h-screen bg-dots flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  )

  const initials = user.email?.slice(0, 2).toUpperCase()
 const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]?.replace(/[0-9]/g, '') || 'there'
  const templateIcon: Record<string, string> = {
    logo_design: '🎨', website: '🌐', uiux: '✏️', social_media: '📱', custom: '📁'
  }

  return (
    <div className="min-h-screen bg-dots relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob w-96 h-96 bg-blue-400 top-0 left-0" style={{ animationDelay: '0s' }} />
      <div className="blob w-80 h-80 bg-purple-400 top-20 right-20" style={{ animationDelay: '3s' }} />
      <div className="blob w-64 h-64 bg-indigo-300 bottom-40 left-1/3" style={{ animationDelay: '6s' }} />

      {/* Navbar */}
      <nav className="slide-down sticky top-4 z-50 mx-4 mt-4">
        <div className="glass rounded-2xl px-6 py-3 flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="text-base font-bold tracking-tight">TokenPay</span>
          </div>
          <div className="flex items-center gap-7">
            {[
              { label: 'Projects', path: '/projects' },
              { label: 'Clients', path: '/clients' },
              { label: 'Invoices', path: '/invoices' },
            ].map(item => (
              <button key={item.path} onClick={() => router.push(item.path)}
                className="nav-link text-sm text-gray-500 font-medium pb-0.5">
                {item.label}
              </button>
            ))}
            <div
             className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all"
          onClick={() => router.push('/settings')}
          title={user.email}
            >
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10 space-y-8 relative z-10">

        {/* Hero welcome */}
        <div className="fade-up glass rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-transparent pointer-events-none rounded-3xl" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">👋 Welcome back</p>
              <h1 className="text-4xl font-bold tracking-tight gradient-text capitalize">
  {firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}
</h1>
              <p className="text-gray-400 text-sm mt-2">Here's what's happening with your projects today.</p>
            </div>
            <button
              onClick={() => router.push('/projects/new')}
              className="shine btn-press bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-5">
          {/* Active projects */}
          <div className="fade-up-1 card-lift glass rounded-2xl p-6 cursor-pointer" onClick={() => router.push('/projects')}>
            <div className="flex justify-between items-start mb-5">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-100">
                📁
              </div>
              <span className="text-xs font-semibold text-gray-300 tracking-widest">PROJECTS</span>
            </div>
            <p className="text-5xl font-bold tracking-tight mb-1">{stats.active}</p>
            <p className="text-sm text-gray-400">Active projects</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-1.5">
              <span className="text-xs text-emerald-500 font-semibold">● Live</span>
              <span className="text-xs text-gray-300">and running</span>
            </div>
          </div>

          {/* Pending approvals */}
          <div className="fade-up-2 card-lift glass rounded-2xl p-6 cursor-pointer">
            <div className="flex justify-between items-start mb-5">
              <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center text-xl border border-orange-100">
                ⏳
              </div>
              <div className="flex items-center gap-1.5">
                {stats.pending > 0 && (
                  <span className="w-2 h-2 bg-orange-400 rounded-full pulse-dot" />
                )}
                <span className="text-xs font-semibold text-gray-300 tracking-widest">PENDING</span>
              </div>
            </div>
            <p className="text-5xl font-bold tracking-tight mb-1">{stats.pending}</p>
            <p className="text-sm text-gray-400">Awaiting client approval</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-orange-400 font-semibold">
                {stats.pending > 0 ? `${stats.pending} milestone${stats.pending > 1 ? 's' : ''} waiting` : 'All caught up ✓'}
              </span>
            </div>
          </div>

          {/* Unbilled amount — hero card */}
          <div
            className="fade-up-3 card-lift rounded-2xl p-6 cursor-pointer relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}
            onClick={() => router.push('/invoices')}
          >
            {/* Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600 rounded-full opacity-20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600 rounded-full opacity-15 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-5">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-xl border border-white/10">
                  💰
                </div>
                <span className="text-xs font-semibold text-gray-500 tracking-widest">UNBILLED</span>
              </div>
              <p className="text-5xl font-bold tracking-tight text-white mb-1">
                ₹{stats.unbilled.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Ready to invoice</p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-xs text-purple-400 font-semibold">Generate invoice →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="fade-up-3 grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/projects/new')}
            className="shine btn-press glass rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold border border-gray-200 hover:border-gray-400"
          >
            🚀 <span>New Project</span>
          </button>
          <button
            onClick={() => router.push('/invoices')}
            className="shine btn-press glass rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold border border-gray-200 hover:border-gray-400"
          >
            🧾 <span>Generate Invoice</span>
          </button>
          <button
            onClick={() => router.push('/clients/new')}
            className="shine btn-press glass rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold border border-gray-200 hover:border-gray-400"
          >
            👤 <span>Add Client</span>
          </button>
        </div>

        {/* Recent projects */}
        <div className="fade-up-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Recent Projects</h2>
            <button onClick={() => router.push('/projects')} className="text-sm text-gray-400 hover:text-black nav-link pb-0.5">
              View all →
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="glass rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
              <p className="text-4xl mb-3">📂</p>
              <p className="text-gray-500 font-medium">No projects yet</p>
              <p className="text-gray-300 text-xs mt-1 mb-5">Create your first project to get started</p>
              <button
                onClick={() => router.push('/projects/new')}
                className="shine btn-press bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="card-lift glass rounded-2xl px-5 py-4 cursor-pointer flex justify-between items-center group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-xl border border-gray-100 group-hover:scale-110 transition-transform">
                      {templateIcon[p.template_type] || '📁'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.clients?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-active">{p.status}</span>
                    <span className="text-gray-200 group-hover:text-gray-600 group-hover:translate-x-1 transition-all text-lg inline-block">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}