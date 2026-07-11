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

export default function NewProjectPage() {
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', client_id: '', template_type: '' })
  const [tokens, setTokens] = useState<{ name: string; description: string; value_inr: string }[]>([])
  const [loading, setLoading] = useState(false)
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: project } = await supabase.from('projects').insert({
      name: form.name,
      client_id: form.client_id,
      freelancer_id: user?.id,
      template_type: form.template_type,
    }).select().single()

    if (project) {
      await supabase.from('tokens').insert(
        tokens.map((t, i) => ({
          project_id: project.id,
          name: t.name,
          description: t.description,
          value_inr: parseFloat(t.value_inr) || 0,
          position: i + 1,
          status: 'pending',
        }))
      )
    }
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push('/dashboard')}>TokenPay</h1>
      </nav>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h2 className="text-2xl font-bold">New Project</h2>

        {/* Project basics */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Project Name</label>
            <input
              type="text"
              placeholder="Logo design for ABC Corp"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Client</label>
            <select
              value={form.client_id}
              onChange={e => setForm({ ...form, client_id: e.target.value })}
              className="mt-1 w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Template picker */}
        <div className="bg-white rounded-xl border p-6 space-y-3">
          <label className="text-sm font-medium text-gray-700">Pick a template</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'logo_design', label: '🎨 Logo Design' },
              { key: 'website', label: '🌐 Website' },
              { key: 'social_media', label: '📱 Social Media' },
              { key: 'uiux', label: '✏️ UI/UX Project' },
              { key: 'custom', label: '⚙️ Custom' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => selectTemplate(t.key)}
                className={`p-3 rounded-lg border text-sm font-medium text-left transition-all ${form.template_type === t.key ? 'border-black bg-black text-white' : 'hover:border-gray-400'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tokens */}
        {form.template_type && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Milestones (Tokens)</label>
              <span className="text-sm font-bold">Total: ₹{total.toLocaleString()}</span>
            </div>
            {tokens.map((token, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400">TOKEN {i + 1}</span>
                  <button onClick={() => removeToken(i)} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
                <input
                  type="text"
                  placeholder="Milestone name"
                  value={token.name}
                  onChange={e => updateToken(i, 'name', e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={token.description}
                  onChange={e => updateToken(i, 'description', e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="number"
                  placeholder="Value in ₹"
                  value={token.value_inr}
                  onChange={e => updateToken(i, 'value_inr', e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            ))}
            <button onClick={addToken} className="w-full border-2 border-dashed rounded-lg py-2 text-sm text-gray-500 hover:border-gray-400">
              + Add milestone
            </button>
          </div>
        )}

        {/* Submit */}
        {tokens.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.client_id}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        )}
      </div>
    </main>
  )
}