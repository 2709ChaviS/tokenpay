'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { HeroBackground } from '@/components/hero-background'

const heroFade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  })
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
}

const featureCards = [
  {
    title: 'Clients, saved once',
    desc: 'Name, email, GST number, address — stored once and reused on every invoice. No retyping GST numbers project after project.',
    image: '/screenshots/clients.png',
  },
  {
    title: 'Templates with milestones built in',
    desc: 'Logo Design, Website, Social Media, UI/UX — pick one and milestones (tokens) are pre-filled with typical deliverables and ₹ values. Or start Custom.',
    image: '/screenshots/projects.png',
  },
  {
    title: 'One dashboard, every project',
    desc: 'Active projects, milestones pending approval, and unbilled amount — at a glance. No spreadsheet required.',
    image: '/screenshots/dashboard.png',
  },
  {
    title: 'Invoices that write themselves',
    desc: 'Client approves a milestone via a one-click link — no login needed on their end. Approved milestones become invoice line items automatically.',
    image: '/screenshots/invoices.png',
  },
]

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      <HeroBackground />

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
      >
        <nav className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl px-4 py-2 shadow-2xl">
          <Link href="/" className="flex items-center gap-2 pl-1">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shrink-0">
              <span className="text-black text-[10px] font-mono font-bold">T</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white hidden sm:inline">TokenPay</span>
          </Link>

          <Link
            href="/login"
            className="text-xs font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            Get started
          </Link>
        </nav>
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-8 pt-32 pb-6 text-center space-y-6">
        <motion.div
          custom={0}
          initial="hidden"
          animate="show"
          variants={heroFade}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/60 font-medium"
        >
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
          className="pt-2 flex justify-center"
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

      {/* Feature card pairs */}
      <div className="relative z-10 max-w-5xl mx-auto px-8 pt-4 pb-20" id="how-it-works">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold mb-3 text-white">How it works</h2>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            From adding a client to getting paid , no manual invoicing anywhere in between.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {featureCards.map((card) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden hover:border-white/20 hover:bg-white/[0.05] transition-colors"
            >
              <div className="bg-black/40">
                {card.image ? (
                  <div className="flex flex-col">
                    <div className="h-8 bg-white/[0.04] border-b border-white/10 flex items-center gap-1.5 px-3 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="relative aspect-[16/10] bg-black">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-contain p-3"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[16/10] flex items-center justify-center">
                    <span className="text-white/20 text-sm">Invoice preview</span>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-2">
                <h3 className="font-semibold text-white text-lg">{card.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Dark statement banner */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUp}
        className="relative z-10 max-w-5xl mx-auto px-8 py-6"
      >
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden py-24 px-8 text-center">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-[3rem] bg-white/[0.03] rotate-12" />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-[3rem] bg-white/[0.03] -rotate-12" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-[3rem] bg-white/[0.03] -rotate-12" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-[3rem] bg-white/[0.03] rotate-12" />

          <h2 className="relative text-2xl sm:text-4xl font-semibold text-white leading-snug max-w-2xl mx-auto">
            Stop chasing approvals in WhatsApp.{' '}
            <span className="inline-block bg-[#2D5DF0] text-white px-3 py-1 rounded-lg">
              Let the link do it.
            </span>
          </h2>
        </div>
      </motion.div>

      <div className="relative z-10 border-t border-white/10 px-8 py-6 text-center">
        <p className="text-xs text-white/30">TokenPay - Built by Chavi Sharma</p>
      </div>
    </main>
  )
}