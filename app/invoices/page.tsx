'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { InvoiceDownloadButton } from '@/components/invoice-download-button'
import { InvoiceRow } from '@/components/invoice-row'

function mapStatus(status: string): 'paid' | 'pending' | 'overdue' {
  if (status === 'paid') return 'paid'
  if (status === 'overdue') return 'overdue'
  return 'pending'
}

export default function InvoicesPage() {
  const [items, setItems] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { router.push('/login'); return }
      setUser(auth.user)

      const { data: pendingItems } = await supabase
        .from('invoice_items')
        .select('*, tokens(name), projects(name), clients(name, email, gst_number)')
        .eq('freelancer_id', auth.user.id)
      setItems(pendingItems || [])

      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('freelancer_id', auth.user.id)
        .order('generated_at', { ascending: false })
      setInvoices(inv || [])
    }
    load()
  }, [])

  const groups = items.reduce((acc: Record<string, any[]>, item) => {
    const key = item.client_id
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  async function generateInvoice(clientId: string, clientItems: any[]) {
    setGeneratingFor(clientId)
    const supabase = createClient()
    const subtotal = clientItems.reduce((sum, i) => sum + (i.amount_inr || 0), 0)
    const gstTotal = clientItems.reduce((sum, i) => sum + (i.gst_amount || 0), 0)
    const grandTotal = clientItems.reduce((sum, i) => sum + (i.final_amount || 0), 0)
    const invoiceNumber = 'INV-2025-' + String(invoices.length + 1).padStart(3, '0')

    const { data: invoice, error } = await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      freelancer_id: user.id,
      client_id: clientId,
      items: clientItems,
      subtotal,
      gst_total: gstTotal,
      grand_total: grandTotal,
      status: 'draft',
    }).select().single()

    if (error) {
      alert('Could not generate invoice: ' + error.message)
      setGeneratingFor(null)
      return
    }

    const itemIds = clientItems.map(i => i.id)
    const tokenIds = clientItems.map(i => i.token_id).filter(Boolean)

    await supabase.from('invoice_items').delete().in('id', itemIds)
    if (tokenIds.length > 0) {
      await supabase.from('tokens').update({ status: 'invoiced' }).in('id', tokenIds)
    }

    const projectIds = [...new Set(clientItems.map(i => i.project_id).filter(Boolean))]
    for (const projectId of projectIds) {
      const { data: allTokens } = await supabase.from('tokens').select('status').eq('project_id', projectId)
      const allDone = (allTokens || []).every((t: any) => t.status === 'invoiced' || t.status === 'paid')
      if (allDone && allTokens && allTokens.length > 0) {
        await supabase.from('projects').update({ status: 'completed' }).eq('id', projectId)
      }
    }

    if (invoice) {
      setInvoices([invoice, ...invoices])
      setItems(items.filter(i => !itemIds.includes(i.id)))
      alert('Invoice ' + invoiceNumber + ' generated! Total: Rs. ' + grandTotal.toLocaleString())
    }
    setGeneratingFor(null)
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    setDeletingInvoice(id)
    const supabase = createClient()
    const { error } = await supabase.from('invoices').delete().eq('id', id)

    if (error) {
      alert('Could not delete: ' + error.message)
      setDeletingInvoice(null)
      return
    }

    setInvoices(invoices.filter(inv => inv.id !== id))
    setDeletingInvoice(null)
  }

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      <div className="aurora-corner" />

      <nav className="relative z-10 border-b border-white/10 px-8 py-4 flex justify-between items-center sticky top-0 bg-black/70 backdrop-blur-xl">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black text-xs font-mono font-bold">T</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">TokenPay</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/projects')} className="text-sm text-white/50 hover:text-white transition-colors">Projects</button>
          <button onClick={() => router.push('/clients')} className="text-sm text-white/50 hover:text-white transition-colors">Clients</button>
          <button onClick={() => router.push('/invoices')} className="text-sm font-medium text-white">Invoices</button>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-8 py-10 space-y-8">
        <div className="fade-up">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white/90">Invoices</h1>
          <p className="text-white/40 text-sm mt-1">Auto-generated from approved milestones</p>
        </div>

        {Object.entries(groups).map(([clientId, clientItems]) => {
          const subtotal = clientItems.reduce((sum, i) => sum + (i.amount_inr || 0), 0)
          const grandTotal = clientItems.reduce((sum, i) => sum + (i.final_amount || 0), 0)
          const clientName = clientItems[0]?.clients?.name || 'Unknown client'

          return (
            <div key={clientId} className="fade-up-1 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">Ready to invoice — {clientName}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{clientItems.length} approved milestone{clientItems.length !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-xs bg-pending/10 text-pending px-3 py-1 rounded-full font-medium border border-pending/30">Unbilled</span>
              </div>
              <div className="px-6 divide-y divide-white/5">
                {clientItems.map((item, i) => (
                  <div key={i} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-white">{item.tokens?.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{item.projects?.name} · {item.clients?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium text-sm text-white">₹{item.amount_inr?.toLocaleString()}</p>
                      <p className="text-xs text-white/40">+GST ₹{item.gst_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-white/[0.02] space-y-2">
                <div className="flex justify-between text-sm text-white/40">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-white/40">
                  <span>GST (18%)</span>
                  <span className="font-mono">₹{(grandTotal - subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-white/10 text-white">
                  <span>Total</span>
                  <span className="font-mono">₹{grandTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => generateInvoice(clientId, clientItems)}
                  disabled={generatingFor === clientId}
                  className="shine btn-press w-full bg-white text-black py-3 rounded-xl font-medium text-sm hover:bg-white/90 disabled:opacity-40 transition-all mt-2"
                >
                  {generatingFor === clientId ? 'Generating…' : `Generate Invoice for ${clientName} →`}
                </button>
              </div>
            </div>
          )
        })}

        {items.length === 0 && invoices.length === 0 && (
          <div className="fade-up-1 rounded-2xl border border-dashed border-white/15 p-16 text-center">
            <p className="text-white/40 text-sm">No approved milestones yet.</p>
            <p className="text-white/30 text-xs mt-1">Approve milestones to generate invoices.</p>
          </div>
        )}

        {invoices.length > 0 && (
          <div className="fade-up-2 space-y-3">
            <h3 className="font-semibold text-white">Past Invoices</h3>
            {invoices.map(inv => {
              const clientName = inv.items?.[0]?.clients?.name || 'Client'
              return (
                <div key={inv.id} className="card-lift rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 flex items-center gap-3 hover:border-white/20 transition-colors">
                  <div className="flex-1">
                    <InvoiceRow
                      tokenId={inv.invoice_number}
                      client={clientName}
                      amount={inv.grand_total || 0}
                      status={mapStatus(inv.status)}
                    />
                  </div>
                  <InvoiceDownloadButton invoice={inv} />
                  <button
                    onClick={() => deleteInvoice(inv.id)}
                    disabled={deletingInvoice === inv.id}
                    className="text-xs text-overdue hover:bg-overdue/10 w-7 h-7 rounded-lg flex items-center justify-center border border-transparent hover:border-overdue/20 transition-colors"
                    title="Delete invoice"
                  >
                    {deletingInvoice === inv.id ? '…' : '🗑'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}