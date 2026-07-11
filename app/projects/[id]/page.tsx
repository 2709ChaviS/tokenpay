'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function ProjectPage() {
  const [project, setProject] = useState<any>(null)
  const [tokens, setTokens] = useState<any[]>([])
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) { router.push('/login'); return }

      const { data: proj } = await supabase
        .from('projects').select('*').eq('id', params.id).single()
      if (!proj) { setLoading(false); return }
      setProject(proj)

      const { data: toks } = await supabase
        .from('tokens').select('*').eq('project_id', params.id).order('position')
      setTokens(toks || [])

      const { data: cl } = await supabase
        .from('clients').select('*').eq('id', proj.client_id).single()
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

    const token = tokens.find(t => t.id === tokenId)
    if (token) {
      const magicToken = crypto.randomUUID()
      await supabase.from('client_sessions').insert({
        token_id: tokenId,
        magic_token: magicToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      const link = window.location.origin + '/approve/' + magicToken
      alert('Share this link with your client:\n\n' + link)
    }

    setTokens(tokens.map(t => t.id === tokenId ? { ...t, status: 'submitted' } : t))
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    submitted: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    disputed: 'bg-red-100 text-red-700',
    paid: 'bg-blue-100 text-blue-700',
  }

  const total = tokens.reduce((sum, t) => sum + (t.value_inr || 0), 0)
  const earned = tokens.filter(t => t.status === 'approved' || t.status === 'paid')
    .reduce((sum, t) => sum + (t.value_inr || 0), 0)

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!project) return <div className="min-h-screen flex items-center justify-center">Project not found</div>

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push('/dashboard')}>TokenPay</h1>
        <span className="text-sm text-gray-500 cursor-pointer" onClick={() => router.push('/dashboard')}>Back to Dashboard</span>
      </nav>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-gray-500 text-sm mt-1">Client: {client?.name} · {client?.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-gray-500 text-sm">Project Value</p>
            <p className="text-2xl font-bold">Rs. {total.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-gray-500 text-sm">Earned so far</p>
            <p className="text-2xl font-bold text-green-600">Rs. {earned.toLocaleString()}</p>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Milestones</h3>
          {tokens.map((token, i) => (
            <div key={token.id} className="bg-white rounded-xl border p-4 flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold">#{i + 1}</span>
                  <span className="font-medium">{token.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[token.status]}`}>
                    {token.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{token.description}</p>
                <p className="text-sm font-bold">Rs. {token.value_inr?.toLocaleString()}</p>
              </div>
              {token.status === 'pending' && (
                <button onClick={() => markComplete(token.id)} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 shrink-0">
                  Mark Complete
                </button>
              )}
              {token.status === 'submitted' && (
                <span className="text-xs text-yellow-600 font-medium shrink-0">Awaiting client</span>
              )}
              {token.status === 'approved' && (
                <span className="text-xs text-green-600 font-medium shrink-0">Approved</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}