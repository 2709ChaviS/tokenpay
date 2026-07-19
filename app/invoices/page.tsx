'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { InvoiceDownloadButton } from '@/components/invoice-download-button'

export default function InvoicesPage() {
  const [items, setItems] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
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

    if (invoice) {
      setInvoices([invoice, ...invoices])
      setItems(items.filter(i => !itemIds.includes(i.id)))
      alert('Invoice ' + invoiceNumber + ' generated! Total: Rs. ' + grandTotal.toLocaleString())
    }
    setGeneratingFor(null)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="text-lg font-bold tracking-tight">TokenPay</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/projects')} className="text-sm text-gray-500 hover:text-black transition-colors">Projects</button>
          <button onClick={() => router.push('/clients')} className="text-sm text-gray-500 hover:text-black transition-colors">Clients</button>
          <button onClick={() => router.push('/invoices')} className="text-sm font-medium text-black">Invoices</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-gray-400 text-sm mt-1">Auto-generated from approved milestones</p>
        </div>

        {Object.entries(groups).map(([clientId, clientItems]) => {
          const subtotal = clientItems.reduce((sum, i) => sum + (i.amount_inr || 0), 0)
          const grandTotal = clientItems.reduce((sum, i) => sum + (i.final_amount || 0), 0)
          const clientName = clientItems[0]?.clients?.name || 'Unknown client'

          return (
            <div key={clientId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Ready to invoice — {clientName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{clientItems.length} approved milestone{clientItems.length !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-xs bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full font-medium border border-yellow-100">Unbilled</span>
              </div>
              <div className="px-6 divide-y divide-gray-50">
                {clientItems.map((item, i) => (
                  <div key={i} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{item.tokens?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.projects?.name} · {item.clients?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₹{item.amount_inr?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">+GST ₹{item.gst_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-gray-50 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>GST (18%)</span>
                  <span>₹{(grandTotal - subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => generateInvoice(clientId, clientItems)}
                  disabled={generatingFor === clientId}
                  className="w-full bg-black text-white py-3 rounded-xl font-medium text-sm hover:bg-gray-800 disabled:opacity-40 transition-all mt-2"
                >
                  {generatingFor === clientId ? 'Generating...' : `Generate Invoice for ${clientName} →`}
                </button>
              </div>
            </div>
          )
        })}

        {items.length === 0 && invoices.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <p className="text-3xl mb-3">🧾</p>
            <p className="text-gray-400 text-sm">No approved milestones yet.</p>
            <p className="text-gray-400 text-xs mt-1">Approve milestones to generate invoices.</p>
          </div>
        )}

        {invoices.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Past Invoices</h3>
            {invoices.map(inv => {
              const clientName = inv.items?.[0]?.clients?.name || 'Client'
              return (
                <div key={inv.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex justify-between items-center hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                      <span className="text-lg">🧾</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{clientName} · ₹{inv.grand_total?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <InvoiceDownloadButton invoice={inv} />
                    <span className="text-xs bg-gray-50 text-gray-500 px-3 py-1 rounded-full border border-gray-100">{inv.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
