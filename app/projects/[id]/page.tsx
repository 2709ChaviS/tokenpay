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

  const res = await fetch('/api/create-approval-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId })
  })
  const data = await res.json()

  if (data.error) {
    alert('Could not create approval link: ' + data.error)
    return
  }

  setApprovalLink(window.location.origin + '/approve/' + data.magicToken)
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
  const earned = tokens.filter(t => t.status === 'approved' || t.status === 'invoiced' || t.status === 'paid').reduce((sum, t) => sum + (t.value_inr || 0), 0)
  const progress = total > 0 ? Math.round((earned / total) * 100) : 0
  const approvedCount = tokens.filter(t => t.status === 'approved' || t.status === 'invoiced' || t.status === 'paid').length

  const templateLabel: Record<string, string> = {
    logo_design: 'Logo', website: 'Web', uiux: 'UI/UX', social_media: 'Social', custom: 'Custom'
  }

  const statusConfig: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-white/5 text-white/40 border border-white/10' },
    submitted: { label: 'Awaiting client', cls: 'bg-pending/10 text-pending border border-pending/30' },
    approved: { label: 'Approved', cls: 'bg-paid/10 text-paid border border-paid/30' },
    disputed: { label: 'Disputed', cls: 'bg-overdue/10 text-overdue border border-overdue/30' },
    invoiced: { label: 'Invoiced', cls: 'bg-accent/10 text-accent border border-accent/30' },
    paid: { label: 'Paid', cls: 'bg-paid/10 text-paid border border-paid/30' },
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-sm text-white/40">Loading project…</p>
      </div>
    </div>
  )

  if (!project) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white/40">Project not found</p>
    </div>
  )

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div className="aurora-corner" />

      <nav className="relative z-10 border-b border-white/10 sticky top-0 bg-black/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-8 h-8 bg-black border border-white/15 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-mono font-bold">T</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-white">TokenPay</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/projects')} className="text-sm text-white/40 hover:text-white transition-colors">
              Back to Projects
            </button>
            <div
              onClick={() => router.push('/settings')}
              className="w-8 h-8 bg-white/10 border border-white/10 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white/20 transition-all"
            >
              <span className="text-xs font-mono font-bold text-white">CH</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-6">

        <div className="fade-up rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs font-medium text-white/40 border border-white/10 rounded-lg px-2.5 py-1.5">
                {templateLabel[project.template_type] || 'Custom'}
              </span>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-white/90">{project.name}</h1>
                <p className="text-white/40 text-sm mt-0.5">
                  Client: <span className="text-white/70 font-medium">{client?.name}</span>
                  <span className="text-white/20 mx-1.5">·</span>
                  <span>{client?.email}</span>
                </p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              project.status === 'completed'
                ? 'text-paid border-paid/30 bg-paid/10'
                : project.status === 'active'
                ? 'text-pending border-pending/30 bg-pending/10'
                : 'text-white/50 border-white/10'
            }`}>
              {project.status}
            </span>
          </div>
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/40">{approvedCount} of {tokens.length} milestones approved</span>
              <span className="font-mono text-xs font-medium text-white">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-paid rounded-full transition-all duration-700" style={{ width: progress + '%' }} />
            </div>
          </div>
        </div>

        <div className="fade-up-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-white tabular-nums">₹{total.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/40 mt-0.5">Project Value</p>
          </div>
          <div className="rounded-2xl border border-paid/20 bg-paid/[0.06] backdrop-blur-sm p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-paid tabular-nums">₹{earned.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/40 mt-0.5">Earned</p>
          </div>
          <div className="rounded-2xl border border-pending/20 bg-pending/[0.06] backdrop-blur-sm p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-pending tabular-nums">₹{(total - earned).toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/40 mt-0.5">Remaining</p>
          </div>
        </div>

        {approvalLink && (
          <div className="fade-up rounded-2xl border border-pending/20 bg-white/[0.03] backdrop-blur-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-pending rounded-full pulse-dot" />
              <p className="font-semibold text-sm text-white">Share approval link with your client</p>
            </div>
            <p className="text-xs text-white/40">Client clicks this link, no login needed. They can approve or raise an issue.</p>
            <div className="flex flex-col sm:flex-row gap-2">
  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/50 truncate font-mono">
    {approvalLink}
  </div>
  <button onClick={copyLink} className="shine btn-press bg-white text-black px-4 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0 hover:bg-white/90 transition-colors">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={shareWhatsApp} className="shine btn-press flex-1 bg-paid text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-paid/90 transition-colors">
                Share on WhatsApp
              </button>
              <button onClick={shareEmail} className="shine btn-press flex-1 border border-white/10 text-white/70 py-2.5 rounded-xl text-xs font-semibold hover:border-white/20 hover:text-white transition-colors">
                Send via Email
              </button>
            </div>
            <p className="text-xs text-white/25">Auto-approves in 7 days if client does not respond.</p>
          </div>
        )}

        <div className="fade-up-2 space-y-3">
          <h2 className="font-semibold text-lg text-white/90">Milestones</h2>
          {tokens.map((token, i) => {
            const config = statusConfig[token.status] || statusConfig.pending
            return (
              <div
                key={token.id}
                className="card-lift rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-white/20 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={
                    'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 ' +
                    (token.status === 'approved' || token.status === 'paid'
                      ? 'bg-paid/10 text-paid border border-paid/30'
                      : token.status === 'submitted'
                      ? 'bg-pending/10 text-pending border border-pending/30'
                      : 'bg-white/5 text-white/40 border border-white/10')
                  }>
                    {token.status === 'approved' || token.status === 'paid' ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{token.name}</p>
                    {token.description && <p className="text-xs text-white/40 mt-0.5">{token.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-mono text-sm font-medium text-white">₹{token.value_inr?.toLocaleString('en-IN')}</span>
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + config.cls}>{config.label}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {token.status === 'pending' && (
                    <button
                      onClick={() => markComplete(token.id)}
                      className="shine btn-press bg-white text-black px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/90 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                  {token.status === 'submitted' && (
                    <div className="text-center">
                      <div className="w-2 h-2 bg-pending rounded-full pulse-dot mx-auto mb-1" />
                      <span className="text-xs text-pending font-medium">Waiting</span>
                    </div>
                  )}
                  {(token.status === 'approved' || token.status === 'paid') && (
                    <div className="w-8 h-8 bg-paid/10 rounded-xl flex items-center justify-center border border-paid/30">
                      <span className="text-paid text-xs font-bold">✓</span>
                    </div>
                  )}
                  {token.status === 'disputed' && (
                    <div className="w-8 h-8 bg-overdue/10 rounded-xl flex items-center justify-center border border-overdue/30">
                      <span className="text-overdue text-sm font-bold">!</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {earned > 0 && (
          <div
            className="fade-up-3 card-lift rounded-2xl border border-accent/20 bg-accent/[0.06] backdrop-blur-sm p-5 flex justify-between items-center cursor-pointer"
            onClick={() => router.push('/invoices')}
          >
            <div>
              <p className="text-white font-semibold">Ready to invoice</p>
              <p className="text-white/40 text-sm mt-0.5">₹{earned.toLocaleString('en-IN')} approved, generate invoice now</p>
            </div>
            <span className="text-accent text-xl font-bold">»</span>
          </div>
        )}
      </div>
    </div>
  )
}