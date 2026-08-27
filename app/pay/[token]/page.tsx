'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Script from 'next/script'

export default function PayPage() {
  const [invoice, setInvoice] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'paid' | 'error'>('loading')
  const [paying, setPaying] = useState(false)
  const params = useParams()

  useEffect(() => {
    fetch('/api/pay/' + params.token)
      .then(res => res.json())
      .then(data => {
        if (data.error) { setStatus('error'); return }
        setInvoice(data.invoice)
        setStatus(data.invoice.payment_status === 'paid' ? 'paid' : 'ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  async function handlePay() {
    setPaying(true)
    const res = await fetch('/api/pay/' + params.token, { method: 'POST' })
    const data = await res.json()

    if (data.error) {
      alert(data.error)
      setPaying(false)
      return
    }

    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: 'INR',
      name: 'TokenPay',
      description: 'Invoice ' + data.invoiceNumber,
      order_id: data.orderId,
      handler: async function (response: any) {
        const verifyRes = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            paymentLinkToken: params.token,
          }),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          setStatus('paid')
        } else {
          alert('Payment verification failed')
        }
        setPaying(false)
      },
      modal: {
        ondismiss: function () {
          setPaying(false)
        },
      },
      theme: { color: '#2D5DF0' },
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  }

  if (status === 'loading') return (
    <main className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-white/40">Loading...</p>
    </main>
  )

  if (status === 'error') return (
    <main className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold text-white">Invoice not found</h2>
        <p className="text-white/40">This payment link may be invalid.</p>
      </div>
    </main>
  )

  if (status === 'paid') return (
    <main className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold text-paid">Payment received</h2>
        <p className="text-white/40">Invoice {invoice?.invoice_number} has been paid. Thank you.</p>
      </div>
    </main>
  )

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <main className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm max-w-md w-full p-8 space-y-6">
          <div>
            <p className="text-sm text-white/40 font-medium">Invoice</p>
            <h2 className="font-mono text-2xl font-semibold text-white mt-1">{invoice?.invoice_number}</h2>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm text-white/40">Amount due</p>
            <p className="font-mono text-3xl font-semibold text-white tabular-nums">
              ₹{invoice?.grand_total?.toLocaleString('en-IN')}
            </p>
          </div>

          <p className="text-sm text-white/50">
            Billed to: <strong className="text-white">{invoice?.clients?.name}</strong>
          </p>

          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {paying ? 'Processing...' : 'Pay Now'}
          </button>

          <p className="text-xs text-white/25 text-center">
            Secure payment powered by Razorpay
          </p>
        </div>
      </main>
    </>
  )
}