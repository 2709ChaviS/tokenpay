'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const templates: Record<string, { name: string; description: string }[]> = {
  logo_design: [
    { name: 'Brief & moodboard approval', description: 'Client approves creative direction' },
    { name: 'First concept presentation', description: '3 logo concepts presented' },
    { name: 'Revision round', description: 'Refinements on selected concept' },
    { name: 'Final files delivery', description: 'All formats delivered (PNG, SVG, PDF)' },
  ],
  website: [
    { name: 'Wireframes approved', description: 'Structure and layout finalized' },
    { name: 'Design mockups approved', description: 'Visual design for all pages' },
    { name: 'Development complete', description: 'Fully functional website' },
    { name: 'Testing & QA', description: 'Cross-browser and mobile testing' },
    { name: 'Launch', description: 'Site goes live' },
  ],
  social_media: [
    { name: 'Creatives batch 1', description: 'First 8 posts designed' },
    { name: 'Creatives batch 2', description: 'Next 8 posts designed' },
    { name: 'Captions & copy', description: 'All post captions written' },
    { name: 'Monthly report', description: 'Performance summary delivered' },
  ],
  uiux: [
    { name: 'Research & discovery', description: 'User research and competitive analysis' },
    { name: 'Wireframes', description: 'Low-fidelity screens' },
    { name: 'UI designs', description: 'High-fidelity Figma designs' },
    { name: 'Prototype', description: 'Clickable prototype ready' },
    { name: 'Handoff', description: 'Dev handoff with specs' },
  ],
  custom: [],
}

const templateOptions = [
  { key: 'logo_design', label: 'Logo Design', hint: '4 milestones' },
  { key: 'website', label: 'Website', hint: '5 milestones' },
  { key: 'social_media', label: 'Social Media', hint: '4 milestones' },
  { key: 'uiux', label: 'UI/UX Project', hint: '5 milestones' },
  { key: 'custom', label: 'Custom', hint: 'Start blank' },
]

export default function NewProjectPage() {
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', client_id: '', template_type: '' })
  const [tokens, setTokens] = useState<{ name: string; description: string; value_inr: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '' })
  const [savingClient, setSavingClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('clients').select('*').eq('freelancer_id', data.user.id).then(({ data: c }) => {
        setClients(c || [])
      })
    })
  }, [])

  function handleClientSelect(value: string) {
    if (value === '__new__') {
      setShowNewClient(true)
      setForm({ ...form, client_id: '' })
    } else {
      setShowNewClient(false)
      setForm({ ...form, client_id: value })
    }
  }

  async function saveNewClient() {
    setSavingClient(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingClient(false); return }

    const { data, error } = await supabase.from('clients').insert({
      name: newClient.name,
      email: newClient.email,
      freelancer_id: user.id,
    }).select().single()

    if (error) {
      alert('Could not add client: ' + error.message)
      setSavingClient(false)
      return
    }

    setClients([...clients, data])
    setForm({ ...form, client_id: data.id })
    setShowNewClient(false)
    setNewClient({ name: '', email: '' })
    setSavingClient(false)
  }

  function selectTemplate(type: string) {
    setForm({ ...form, template_type: type })
    setTokens(templates[type].map(t => ({ ...t, value_inr: '' })))
  }

  function updateToken(index: number, field: string, value: string) {
    const updated = [...tokens]
    updated[index] = { ...updated[index], [field]: value }
    setTokens(updated)
  }

  function addToken() {
    setTokens([...tokens, { name: '', description: '', value_inr: '' }])
  }

  function removeToken(index: number) {
    setTokens(tokens.filter((_, i) => i !== index))
  }

  const total = tokens.reduce((sum, t) => sum + (parseFloat(t.value_inr) || 0), 0)

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Session expired. Please log in again.')
      setLoading(false)
      router.push('/login')
      return
    }

    const { data: project, error: projectError } = await supabase.from('projects').insert({
      name: form.name,
      client_id: form.client_id,
      freelancer_id: user.id,
      template_type: form.template_type,
    }).select().single()

    if (projectError || !project) {
      setError(projectError?.message || 'Could not create project.')
      setLoading(false)
      return
    }

    const { error: tokensError } = await supabase.from('tokens').insert(
      tokens.map((t, i) => ({
        project_id: project.id,
        name: t.name,
        description: t.description,
        value_inr: parseFloat(t.value_inr) || 0,
        position: i + 1,
        status: 'pending',
      }))
    )

    if (tokensError) {
      setError(tokensError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      <div className="aurora-corner" />

      <nav className="relative z-10 border-b border-white/10 px-6 py-4 sticky top-0 bg-black/70 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6">
        <div className="fade-up space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white/90">New project</h1>
          <p className="text-sm text-white/40">Set up milestones and we'll handle the invoicing.</p>
        </div>

        <div className="fade-up-1 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wide">
              Project name
            </label>
            <input
              type="text"
              placeholder="Logo design for ABC Corp"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white bg-white/5 placeholder:text-white/25 outline-none transition-shadow focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wide">
              Client
            </label>
            <select
              value={form.client_id}
              onChange={e => handleClientSelect(e.target.value)}
              className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-shadow focus:ring-2 focus:ring-accent/30 focus:border-accent bg-white/5"
            >
              <option value="" className="bg-black">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id} className="bg-black">{c.name}</option>)}
              <option value="__new__" className="bg-black">+ Add new client</option>
            </select>

            {showNewClient && (
              <div className="mt-3 border border-white/10 rounded-xl p-4 space-y-2.5 bg-white/[0.02]">
                <input
                  type="text"
                  placeholder="Client name"
                  value={newClient.name}
                  onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm outline-none bg-white/5 text-white placeholder:text-white/25 focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
                <input
                  type="email"
                  placeholder="Client email"
                  value={newClient.email}
                  onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm outline-none bg-white/5 text-white placeholder:text-white/25 focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveNewClient}
                    disabled={savingClient || !newClient.name || !newClient.email}
                    className="bg-white text-black px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-white/90 disabled:opacity-40 transition-colors"
                  >
                    {savingClient ? 'Saving…' : 'Save client'}
                  </button>
                  <button
                    onClick={() => { setShowNewClient(false); setNewClient({ name: '', email: '' }) }}
                    className="border border-white/10 px-4 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:border-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="fade-up-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 space-y-3">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wide">
            Pick a template
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {templateOptions.map(t => {
              const selected = form.template_type === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => selectTemplate(t.key)}
                  className={`rounded-xl border p-3.5 text-left transition-all ${
                    selected
                      ? 'border-accent bg-accent/[0.08] ring-1 ring-accent/30'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <p className={`text-sm font-medium ${selected ? 'text-accent' : 'text-white'}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{t.hint}</p>
                </button>
              )
            })}
          </div>
        </div>

        {form.template_type && (
          <div className="fade-up-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 space-y-4">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wide">
                Milestones
              </label>
              <span className="font-mono text-sm font-medium text-white tabular-nums">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-3">
              {tokens.map((token, i) => (
                <div key={i} className="border border-white/10 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-medium text-white/40">
                      TOKEN {String(i + 1).padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => removeToken(i)}
                      className="text-xs text-overdue hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Milestone name"
                    value={token.name}
                    onChange={e => updateToken(i, 'name', e.target.value)}
                    className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm bg-white/5 text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={token.description}
                    onChange={e => updateToken(i, 'description', e.target.value)}
                    className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm bg-white/5 text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                  <input
                    type="number"
                    placeholder="Value in ₹"
                    value={token.value_inr}
                    onChange={e => updateToken(i, 'value_inr', e.target.value)}
                    className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm font-mono bg-white/5 text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addToken}
              className="w-full border border-dashed border-white/15 rounded-xl py-2.5 text-sm text-white/40 hover:border-white/25 hover:text-white transition-colors"
            >
              + Add milestone
            </button>
          </div>
        )}

        {error && (
          <p className="text-overdue text-sm text-center">{error}</p>
        )}

        {tokens.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.client_id}
            className="shine btn-press w-full bg-white text-black py-3 rounded-xl font-medium text-sm hover:bg-white/90 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Creating…' : 'Create project'}
          </button>
        )}
      </div>
    </main>
  )
}