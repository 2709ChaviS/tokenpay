'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { InvoiceDownloadButton } from '@/components/invoice-download-button'
import { InvoiceRow } from '@/components/invoice-row'

function mapStatus(invoice: any): 'paid' | 'pending' | 'overdue' {
  if (invoice.payment_status === 'paid' || invoice.status === 'paid') return 'paid'
  if (invoice.status === 'overdue') return 'overdue'
  return 'pending'
}

export default function InvoicesPage() {
  const [items, setItems] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
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
    const res = await fetch('/api/invoices/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
    const data = await res.json()
    setGeneratingFor(null)
    if (data.error) { alert('Could not generate invoice: ' + data.error); return }
    const ids = clientItems.map(i => i.id)
    setInvoices([data.invoice, ...invoices])
    setItems(items.filter(i => !ids.includes(i.id)))
  }

  async function markPaid(id: string) {
    if (!confirm('Mark this invoice as paid (received via UPI / bank transfer)?')) return
    const res = await fetch('/api/invoices/' + id + '/mark-paid', { method: 'POST' })
    const data = await res.json()
    if (data.error) { alert(data.error); return }
    setInvoices(invoices.map(i => i.id === id ? { ...i, payment_status: 'paid', status: 'paid', paid_at: new Date().toISOString() } : i))
  }

  async function deleteInvoice(id: string) {
    const target = invoices.find(i => i.id === id)
    if (target && (target.payment_status === 'paid' || target.status === 'paid')) {
      alert('Paid invoices are kept for your accounting records and cannot be deleted.')
      return
    }
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

  async function copyPayLink(token: string) {
    const url = window.location.origin + '/pay/' + token
    await navigator.clipboard.writeText(url)
    setCopiedLink(token)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      <div className="aurora-corner" />

      <nav className="relative z-10 border-b border-white/10 px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 bg-black/70 backdrop-blur-xl">
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

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8">
        <div className="fade-up">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white/90">Invoices</h1>
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
                  <div key={i} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                    <div>
                      <p className="font-medium text-sm text-white">{item.tokens?.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{item.projects?.name} · {item.clients?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium text-sm text-white">₹{item.amount_inr?.toLocaleString('en-IN')}</p>
                      {item.gst_rate > 0 && <p className="text-xs text-white/40">+GST ₹{item.gst_amount?.toLocaleString('en-IN')}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-white/[0.02] space-y-2">
                <div className="flex justify-between text-sm text-white/40">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-white/40">
                  <span>{grandTotal - subtotal > 0 ? 'GST (18%)' : 'GST (not registered)'}</span>
                  <span className="font-mono">₹{(grandTotal - subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-white/10 text-white">
                  <span>Total</span>
                  <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
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
              const isPaid = inv.payment_status === 'paid' || inv.status === 'paid'
              return (
                <div key={inv.id} className="card-lift rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3 sm:p-5 flex items-center gap-2 sm:gap-3 hover:border-white/20 transition-colors overflow-x-auto">
                  <div className="flex-1 min-w-0">
                    <InvoiceRow
                      tokenId={inv.invoice_number}
                      client={clientName}
                      amount={inv.grand_total || 0}
                      status={mapStatus(inv)}
                    />
                  </div>
                  {!isPaid && inv.payment_link_token && (
                    <button
                      onClick={() => copyPayLink(inv.payment_link_token)}
                      className="text-xs font-medium bg-accent/10 text-accent border border-accent/30 px-3 py-1.5 rounded-full hover:bg-accent/20 transition-colors whitespace-nowrap"
                    >
                      {copiedLink === inv.payment_link_token ? 'Copied!' : 'Copy Pay Link'}
                    </button>
                  )}
                  {!isPaid && (
                    <button
                      onClick={() => markPaid(inv.id)}
                      className="text-xs font-medium bg-paid/10 text-paid border border-paid/30 px-3 py-1.5 rounded-full hover:bg-paid/20 transition-colors whitespace-nowrap"
                    >
                      Mark paid
                    </button>
                  )}
                  <InvoiceDownloadButton invoice={inv} />
                  <button
                    onClick={() => deleteInvoice(inv.id)}
                    disabled={deletingInvoice === inv.id}
                    className="text-xs text-overdue hover:bg-overdue/10 w-7 h-7 rounded-lg flex items-center justify-center border border-transparent hover:border-overdue/20 transition-colors flex-shrink-0"
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