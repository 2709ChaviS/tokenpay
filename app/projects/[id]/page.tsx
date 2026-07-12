'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function ProjectPage() {
  const [project, setProject] = useState<any>(null)
  const [tokens, setTokens] = useState<any[]>([])
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [approvalLink, setApprovalLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) { router.push('/login'); return }
      const { data: proj } = await supabase.from('projects').select('*').eq('id', params.id).single()
      if (!proj) { setLoading(false); return }
      setProject(proj)
      const { data: toks } = await supabase.from('tokens').select('*').eq('project_id', params.id).order('position')
      setTokens(toks || [])
      const { data: cl } = await supabase.from('clients').select('*').eq('id', proj.client_id).single()
      setClient(cl)
      setLoading(false)
    }
    load()
  }, [])

  async function markComplete(tokenId: string) {
    const supabase = createClient()
    await supabase.from('tokens').update({
      status: 'submitted',
      freelancer_approved_at: new Date().toISOString(),
      auto_approve_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }).eq('id', tokenId)
    const magicToken = crypto.randomUUID()
    await supabase.from('client_sessions').insert({
      token_id: tokenId,
      magic_token: magicToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    setApprovalLink(window.location.origin + '/approve/' + magicToken)
    setTokens(tokens.map(t => t.id === tokenId ? { ...t, status: 'submitted' } : t))
  }

  async function copyLink() {
    if (!approvalLink) return
    await navigator.clipboard.writeText(approvalLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const text = 'Hi! Please approve this milestone: ' + approvalLink
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank')
  }

  function shareEmail() {
    if (!client || !approvalLink) return
    const subject = 'Please approve this milestone'
    const body = 'Hi ' + client.name + ',\n\nPlease review and approve this milestone:\n\n' + approvalLink + '\n\nNo login needed.'
    window.open('mailto:' + client.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body))
  }

  const total = tokens.reduce((sum, t) => sum + (t.value_inr || 0), 0)
  const earned = tokens.filter(t => t.status === 'approved' || t.status === 'paid').reduce((sum, t) => sum + (t.value_inr || 0), 0)
  const progress = total > 0 ? Math.round((earned / total) * 100) : 0
  const approvedCount = tokens.filter(t => t.status === 'approved' || t.status === 'paid').length

  const templateIcon: Record<string, string> = {
    logo_design: '🎨', website: '🌐', uiux: '✏️', social_media: '📱', custom: '📁'
  }

  const statusConfig: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
    submitted: { label: 'Awaiting client', cls: 'bg-orange-50 text-orange-600 border border-orange-200' },
    approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
    disputed: { label: 'Disputed', cls: 'bg-red-50 text-red-500 border border-red-200' },
    paid: { label: 'Paid', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
  }

  if (loading) return (
    <div className="min-h-screen bg-dots flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading project...</p>
      </div>
    </div>
  )

  if (!project) return (
    <div className="min-h-screen bg-dots flex items-center justify-center">
      <p className="text-gray-400">Project not found</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-dots relative overflow-hidden">
      <div className="blob w-96 h-96 bg-blue-300 -top-20 -right-20" />
      <div className="blob w-64 h-64 bg-purple-300 bottom-40 left-10" style={{ animationDelay: '4s' }} />

      <nav className="slide-down sticky top-4 z-50 mx-4 mt-4">
        <div className="glass rounded-2xl px-6 py-3 flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="text-base font-bold tracking-tight">TokenPay</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/projects')} className="text-sm text-gray-400 hover:text-black transition-colors">
              Back to Projects
            </button>
            <div onClick={() => router.push('/settings')} className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all">
              <span className="text-xs font-bold text-white">CH</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10 space-y-6 relative z-10">

        <div className="fade-up glass rounded-3xl p-7 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-transparent pointer-events-none rounded-3xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl border border-gray-100">
                  {templateIcon[project.template_type] || '📁'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                  <p className="text-gray-400 text-sm mt-0.5">
                    Client: <span className="text-gray-600 font-medium">{client?.name}</span>
                    <span className="text-gray-300 mx-1.5">·</span>
                    <span>{client?.email}</span>
                  </p>
                </div>
              </div>
              <span className="badge badge-active">{project.status}</span>
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">{approvedCount} of {tokens.length} milestones approved</span>
                <span className="text-xs font-bold">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700" style={{ width: progress + '%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="fade-up-1 grid grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">Rs.{total.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">Project Value</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">Rs.{earned.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">Earned</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">Rs.{(total - earned).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">Remaining</p>
          </div>
        </div>

        {approvalLink && (
          <div className="fade-up glass rounded-2xl p-5 border border-orange-100 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-400 rounded-full pulse-dot" />
              <p className="font-semibold text-sm">Share approval link with your client</p>
            </div>
            <p className="text-xs text-gray-400">Client clicks this link, no login needed. They can approve or raise an issue.</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-500 truncate font-mono">
                {approvalLink}
              </div>
              <button onClick={copyLink} className="shine btn-press bg-black text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={shareWhatsApp} className="shine btn-press flex-1 bg-green-500 text-white py-2.5 rounded-xl text-xs font-semibold">
                Share on WhatsApp
              </button>
              <button onClick={shareEmail} className="shine btn-press flex-1 border border-gray-200 py-2.5 rounded-xl text-xs font-semibold hover:border-gray-400">
                Send via Email
              </button>
            </div>
            <p className="text-xs text-gray-300">Auto-approves in 7 days if client does not respond.</p>
          </div>
        )}

        <div className="fade-up-2 space-y-3">
          <h2 className="font-bold text-lg">Milestones</h2>
          {tokens.map((token, i) => {
            const config = statusConfig[token.status] || statusConfig.pending
            return (
              <div key={token.id} className="card-lift glass rounded-2xl p-5 flex justify-between items-center group" style={{ animationDelay: i * 50 + 'ms' }}>
                <div className="flex items-center gap-4">
                  <div className={'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ' + (token.status === 'approved' || token.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : token.status === 'submitted' ? 'bg-orange-50 text-orange-500 border border-orange-200' : 'bg-gray-50 text-gray-400 border border-gray-200')}>
                    {token.status === 'approved' || token.status === 'paid' ? 'OK' : i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{token.name}</p>
                    {token.description && <p className="text-xs text-gray-400 mt-0.5">{token.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-sm font-bold">Rs.{token.value_inr?.toLocaleString()}</span>
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + config.cls}>{config.label}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {token.status === 'pending' && (
                    <button onClick={() => markComplete(token.id)} className="shine btn-press bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold">
                      Mark Complete
                    </button>
                  )}
                  {token.status === 'submitted' && (
                    <div className="text-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full pulse-dot mx-auto mb-1" />
                      <span className="text-xs text-orange-500 font-medium">Waiting</span>
                    </div>
                  )}
                  {(token.status === 'approved' || token.status === 'paid') && (
                    <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-200">
                      <span className="text-emerald-600 text-xs font-bold">Done</span>
                    </div>
                  )}
                  {token.status === 'disputed' && (
                    <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center border border-red-200">
                      <span className="text-red-500 text-sm font-bold">!</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {earned > 0 && (
          <div className="fade-up-3 rounded-2xl p-5 flex justify-between items-center cursor-pointer card-lift" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }} onClick={() => router.push('/invoices')}>
            <div>
              <p className="text-white font-semibold">Ready to invoice</p>
              <p className="text-gray-400 text-sm mt-0.5">Rs.{earned.toLocaleString()} approved, generate invoice now</p>
            </div>
            <span className="text-white text-xl font-bold">»</span>
          </div>
        )}
      </div>
    </div>
  )
}