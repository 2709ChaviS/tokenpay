import Link from 'next/link'

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      <div className="aurora-bg" />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black text-xs font-mono font-bold">T</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">TokenPay</span>
        </div>
        <Link href="/login" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-xl hover:bg-white/90 transition-colors">
          Get started →
        </Link>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 pt-24 pb-16 text-center space-y-6 fade-up">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/60 font-medium">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot"></span>
          Built for Indian freelancers
        </div>
        <h1 className="font-display text-6xl font-semibold tracking-tight leading-tight text-white/90">
          Invoicing without<br />
          <span className="text-white/30">manual entries</span>
        </h1>
        <p className="text-white/50 text-xl max-w-xl mx-auto leading-relaxed">
          Define milestones. Client approves. Invoice generates itself. No typing required.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Link href="/login" className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-white/90 transition-colors">
            Start for free
          </Link>
          <a href="#how-it-works" className="border border-white/15 px-6 py-3 rounded-xl font-medium hover:bg-white/5 transition-colors text-white/70">
            See how it works
          </a>
        </div>
      </div>

      {/* How it works */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 py-16" id="how-it-works">
        <h2 className="text-center text-2xl font-semibold mb-12 text-white">How it works</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Create a project', desc: 'Pick a template — Logo Design, Website, UI/UX. Tokens are pre-filled.' },
            { step: '02', title: 'Mark milestones done', desc: 'Click "Mark Complete". Client gets a one-click approval link. No signup needed.' },
            { step: '03', title: 'Invoice generates itself', desc: 'Approved milestones become line items. Click Generate — GST invoice is ready.' },
          ].map((item, i) => (
            <div
              key={item.step}
              className={`rounded-2xl p-6 space-y-3 border border-white/10 bg-white/[0.03] backdrop-blur-sm fade-up-${i + 1}`}
            >
              <span className="font-mono text-xs font-medium text-white/30">{item.step}</span>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/10 px-8 py-6 text-center">
        <p className="text-xs text-white/30">TokenPay · Built by Chavi Sharma</p>
      </div>
    </main>
  )
}