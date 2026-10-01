const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL

export default function Privacy() {
  return (
    <main className="min-h-screen bg-black text-white/70 px-4 py-12">
      <article className="max-w-2xl mx-auto space-y-4 text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold text-white">Privacy Policy</h1>
        <h2 className="text-white font-medium pt-2">What we store</h2>
        <p>Your account email, the profile details you enter (name, GST/PAN, address, UPI/bank details), and the clients, projects, milestones and invoices you create.</p>
        <h2 className="text-white font-medium pt-2">Who processes it</h2>
        <p>Supabase (database and login), Vercel (hosting), Resend (emails) and Razorpay (payments). Card and UPI details entered at checkout go to Razorpay and are never stored by TokenPay.</p>
        <h2 className="text-white font-medium pt-2">Your clients</h2>
        <p>Approval and payment links are private, unguessable URLs. Anyone with a link can act on that one milestone or invoice, so share links only with the intended client.</p>
        <h2 className="text-white font-medium pt-2">Deletion</h2>
        <p>Email us to delete your account and all associated data.</p>
        {SUPPORT && <p>Contact: <a className="underline" href={`mailto:${SUPPORT}`}>{SUPPORT}</a></p>}
      </article>
    </main>
  )
}
