'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function InvoicesPage() {
  const [items, setItems] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
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

  async function generateInvoice() {
    if (items.length === 0) return
    setGenerating(true)
    const supabase = createClient()
    const subtotal = items.reduce((sum, i) => sum + (i.amount_inr || 0), 0)
    const gstTotal = items.reduce((sum, i) => sum + (i.gst_amount || 0), 0)
    const grandTotal = items.reduce((sum, i) => sum + (i.final_amount || 0), 0)
    const invoiceNumber = 'INV-2025-' + String(invoices.length + 1).padStart(3, '0')

    const { data: invoice } = await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      freelancer_id: user.id,
      items,
      subtotal,
      gst_total: gstTotal,
      grand_total: grandTotal,
      status: 'draft',
    }).select().single()

    if (invoice) {
      setInvoices([invoice, ...invoices])
      setItems([])
      alert('Invoice ' + invoiceNumber + ' generated! Total: Rs. ' + grandTotal.toLocaleString())
    }
    setGenerating(false)
  }

  const subtotal = items.reduce((sum, i) => sum + (i.amount_inr || 0), 0)
  const grandTotal = items.reduce((sum, i) => sum + (i.final_amount || 0), 0)

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

        {/* Unbilled items */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Ready to invoice</h3>
                <p className="text-xs text-gray-400 mt-0.5">{items.length} approved milestone{items.length !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-xs bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full font-medium border border-yellow-100">Unbilled</span>
            </div>
            <div className="px-6 divide-y divide-gray-50">
              {items.map((item, i) => (
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
                onClick={generateInvoice}
                disabled={generating}
                className="w-full bg-black text-white py-3 rounded-xl font-medium text-sm hover:bg-gray-800 disabled:opacity-40 transition-all mt-2"
              >
                {generating ? 'Generating...' : 'Generate Invoice →'}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && invoices.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <p className="text-3xl mb-3">🧾</p>
            <p className="text-gray-400 text-sm">No approved milestones yet.</p>
            <p className="text-gray-400 text-xs mt-1">Approve milestones to generate invoices.</p>
          </div>
        )}

        {/* Past invoices */}
        {invoices.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Past Invoices</h3>
            {invoices.map(inv => (
              <div key={inv.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex justify-between items-center hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <span className="text-lg">🧾</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{inv.invoice_number}</p>
                    <p className="text-xs text-gray-400 mt-0.5">₹{inv.grand_total?.toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-50 text-gray-500 px-3 py-1 rounded-full border border-gray-100">{inv.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}