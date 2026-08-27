'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StaggerGroup, StaggerCard } from '@/components/stagger-in'
import { HeroBackground } from '@/components/hero-background'

const heroFade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  })
}

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      <HeroBackground />

      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 border-b border-white/10 px-8 py-4 flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black text-xs font-mono font-bold">T</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">TokenPay</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
        >
          Get started
        </Link>
      </motion.nav>

      <div className="relative z-10 max-w-4xl mx-auto px-8 pt-24 pb-16 text-center space-y-6">
        <motion.div
          custom={0}
          initial="hidden"
          animate="show"
          variants={heroFade}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/60 font-medium"
        >
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot"></span>
          Built for Indian freelancers
        </motion.div>

        <motion.h1
          custom={1}
          initial="hidden"
          animate="show"
          variants={heroFade}
          className="font-display text-4xl sm:text-6xl font-semibold tracking-tight leading-tight text-white/90"
        >
          Invoicing without<br />
          <span className="text-white/30">manual entries</span>
        </motion.h1>

        <motion.p
          custom={2}
          initial="hidden"
          animate="show"
          variants={heroFade}
          className="text-white/50 text-xl max-w-xl mx-auto leading-relaxed"
        >
          Define milestones. Client approves. Invoice generates itself. No typing required.
        </motion.p>

        <motion.div
          custom={3}
          initial="hidden"
          animate="show"
          variants={heroFade}
          className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
        >
          <Link
            href="/login"
            className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
          >
            Start for free
          </Link>
          <Link
            href="#how-it-works"
            className="border border-white/15 px-6 py-3 rounded-xl font-medium hover:bg-white/5 transition-all hover:scale-105 active:scale-95 text-white/70"
          >
            See how it works
          </Link>
        </motion.div>

        <motion.div
          custom={4}
          initial="hidden"
          animate="show"
          variants={heroFade}
          className="pt-8 flex justify-center"
        >
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/20"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-16" id="how-it-works">
        <h2 className="text-center text-2xl font-semibold mb-12 text-white">How it works</h2>
        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Create a project', desc: 'Pick a template - Logo Design, Website, UI/UX. Tokens are pre-filled.' },
            { step: '02', title: 'Mark milestones done', desc: 'Click Mark Complete. Client gets a one-click approval link. No signup needed.' },
            { step: '03', title: 'Invoice generates itself', desc: 'Approved milestones become line items. Click Generate - GST invoice is ready.' },
          ].map((item) => (
            <StaggerCard
              key={item.step}
              className="rounded-2xl p-6 space-y-3 border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-white/20 hover:bg-white/[0.05] transition-colors"
            >
              <span className="font-mono text-xs font-medium text-white/30">{item.step}</span>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
            </StaggerCard>
          ))}
        </StaggerGroup>
      </div>

      <div className="relative z-10 border-t border-white/10 px-8 py-6 text-center">
        <p className="text-xs text-white/30">TokenPay - Built by Chavi Sharma</p>
      </div>
    </main>
  )
}