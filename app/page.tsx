import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="text-lg font-bold tracking-tight">TokenPay</span>
        </div>
        <Link href="/login" className="text-sm font-medium bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors">
          Get started →
        </Link>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-500 font-medium">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
          Built for Indian freelancers
        </div>
        <h1 className="text-6xl font-bold tracking-tight leading-tight">
          Invoicing without<br />
          <span className="text-gray-300">manual entries</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-xl mx-auto leading-relaxed">
          Define milestones. Client approves. Invoice generates itself. No typing required.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Link href="/login" className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
            Start for free
          </Link>
          <a href="/demo" className="border border-gray-200 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-gray-600">
          See how it works
        </a>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-8 py-16" id="how-it-works">
        <h2 className="text-center text-2xl font-bold mb-12">How it works</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Create a project', desc: 'Pick a template — Logo Design, Website, UI/UX. Tokens are pre-filled.' },
            { step: '02', title: 'Mark milestones done', desc: 'Click "Mark Complete". Client gets a one-click approval link. No signup needed.' },
            { step: '03', title: 'Invoice generates itself', desc: 'Approved milestones become line items. Click Generate — GST invoice is ready.' },
          ].map(item => (
            <div key={item.step} className="bg-gray-50 rounded-2xl p-6 space-y-3">
              <span className="text-xs font-bold text-gray-300">{item.step}</span>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-8 py-6 text-center">
        <p className="text-xs text-gray-300">TokenPay · Built for freelancers</p>
      </div>
    </main>
  )
}