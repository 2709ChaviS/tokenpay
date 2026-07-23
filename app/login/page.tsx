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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLogin(email, password);
  }

  function handleDemoLogin() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    handleLogin(DEMO_EMAIL, DEMO_PASSWORD);
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
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-white/50 uppercase tracking-wide">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="font-mono text-sm pr-14 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90 rounded-lg h-10"
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Log in'}
            </Button>
          </form>

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
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'View live demo →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}