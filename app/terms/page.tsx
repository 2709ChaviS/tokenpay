const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL

export default function Terms() {
  return (
    <main className="min-h-screen bg-black text-white/70 px-4 py-12">
      <article className="max-w-2xl mx-auto space-y-4 text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold text-white">Terms of Service</h1>
        <p>TokenPay is a milestone-based invoicing tool for freelancers. By creating an account you agree to the points below.</p>
        <h2 className="text-white font-medium pt-2">Your responsibilities</h2>
        <p>You are responsible for the accuracy of the invoices you generate, including GST details, and for complying with applicable tax law. TokenPay does not provide tax, legal, or accounting advice.</p>
        <h2 className="text-white font-medium pt-2">Payments</h2>
        <p>Online payments are processed by Razorpay. TokenPay does not hold your funds. Payment disputes and refunds are between you and your client, subject to Razorpay's terms.</p>
        <h2 className="text-white font-medium pt-2">Availability</h2>
        <p>The service is provided as-is. We aim for high availability but do not guarantee uninterrupted service. Export your invoices regularly for your own records.</p>
        <h2 className="text-white font-medium pt-2">Termination</h2>
        <p>You may stop using the service at any time. We may suspend accounts that misuse the service.</p>
        {SUPPORT && <p>Questions: <a className="underline" href={`mailto:${SUPPORT}`}>{SUPPORT}</a></p>}
      </article>
    </main>
  )
}
