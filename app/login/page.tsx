'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEMO_EMAIL = 'demo@tokenpay.app';
const DEMO_PASSWORD = 'Demo2026Pass';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const [demoLoading, setDemoLoading] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setLinkSent(true);
  }

  async function handleDemoLogin() {
    setError(null);
    setDemoLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    setDemoLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-4 overflow-hidden">
      <div className="aurora-bg" />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black border border-white/15 text-white font-mono text-lg font-semibold">
            T
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white/90">
            TokenPay
          </h1>
          <p className="text-sm text-white/60">
            Freelancer invoicing without manual entries
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl space-y-5">
          {linkSent ? (
            <div className="text-center space-y-2 py-4">
              <p className="text-sm text-white">Check your inbox</p>
              <p className="text-xs text-white/50">
                We sent a login link to <span className="text-white/80">{email}</span>. Click it to sign in.
              </p>
              <button
                type="button"
                onClick={() => setLinkSent(false)}
                className="text-xs text-white/40 hover:text-white underline mt-2"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-white/50 uppercase tracking-wide">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="font-mono text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90 rounded-lg h-10"
                disabled={loading}
              >
                {loading ? 'Sending link…' : 'Send magic link'}
              </Button>
              <p className="text-xs text-white/30 text-center">
                No password needed — we'll email you a login link.
              </p>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-2 text-white/40">or</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
            <p className="text-sm font-medium text-white">Recruiter or investor?</p>
            <p className="text-xs text-white/50 leading-relaxed">
              Pre-loaded demo account with sample invoices and clients — no signup required.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 rounded-lg h-9 text-sm bg-transparent"
              onClick={handleDemoLogin}
              disabled={demoLoading}
            >
              {demoLoading ? 'Logging in…' : 'View live demo →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}