'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function ApprovePage() {
  const [token, setToken] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'pending' | 'approved' | 'disputed' | 'already_done' | 'error'>('loading')
  const [disputeReason, setDisputeReason] = useState('')
  const [showDispute, setShowDispute] = useState(false)
  const params = useParams()

  useEffect(() => {
    fetch('/api/approve/' + params.magic_token)
      .then(res => res.json())
      .then(data => {
        if (data.error) { setStatus('error'); return }
        setToken(data.token)
        setProject(data.project)
        if (data.token?.status === 'approved') setStatus('already_done')
        else setStatus('pending')
      })
      .catch(() => setStatus('error'))
  }, [])

  async function handleApprove() {
    const res = await fetch('/api/approve/' + params.magic_token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' })
    })
    const data = await res.json()
    if (data.error) { setStatus('error'); return }
    setStatus('approved')
  }

  async function handleDispute() {
    const res = await fetch('/api/approve/' + params.magic_token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dispute', disputeReason })
    })
    const data = await res.json()
    if (data.error) { setStatus('error'); return }
    setStatus('disputed')
  }

  if (status === 'loading') return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Loading...</p>
    </main>
  )

  if (status === 'error') return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 p-8">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold">Link not valid</h2>
        <p className="text-gray-500">This link may have expired or already been used.</p>
      </div>
    </main>
  )

  if (status === 'approved') return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 p-8">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold">Approved!</h2>
        <p className="text-gray-500">Milestone approved. The freelancer has been notified.</p>
      </div>
    </main>
  )

  if (status === 'disputed') return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 p-8">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold">Issue raised</h2>
        <p className="text-gray-500">The freelancer has been notified about your concern.</p>
      </div>
    </main>
  )

  if (status === 'already_done') return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 p-8">
        <div className="text-5xl">✓</div>
        <h2 className="text-2xl font-bold">Already approved</h2>
        <p className="text-gray-500">This milestone was already approved.</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border shadow-sm max-w-md w-full p-8 space-y-6">
        <div>
          <p className="text-sm text-gray-500 font-medium">Milestone approval request</p>
          <h2 className="text-2xl font-bold mt-1">{token?.name}</h2>
          <p className="text-gray-500 text-sm mt-1">{token?.description}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Amount</p>
          <p className="text-3xl font-bold">₹{token?.value_inr?.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">+ 18% GST = ₹{(token?.value_inr * 1.18)?.toLocaleString()}</p>
        </div>

        <p className="text-sm text-gray-500">
          Project: <strong>{project?.name}</strong>
        </p>

        {!showDispute ? (
          <div className="space-y-3">
            <button
              onClick={handleApprove}
              className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800"
            >
              ✓ Approve this milestone
            </button>
            <button
              onClick={() => setShowDispute(true)}
              className="w-full border py-3 rounded-xl font-medium text-red-500 hover:bg-red-50"
            >
              Something's wrong
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              placeholder="What's the issue? Describe clearly..."
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black resize-none h-24"
            />
            <button
              onClick={handleDispute}
              disabled={!disputeReason}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 disabled:opacity-50"
            >
              Submit issue
            </button>
            <button
              onClick={() => setShowDispute(false)}
              className="w-full border py-3 rounded-xl font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          No account needed. This link was sent by your freelancer.
        </p>
      </div>
    </main>
  )
}