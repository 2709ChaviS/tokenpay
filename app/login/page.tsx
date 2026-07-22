// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEMO_EMAIL = 'demo@tokenpay.app';
const DEMO_PASSWORD = 'demo@26';

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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-white font-mono text-lg font-semibold">
            T
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            TokenPay
          </h1>
          <p className="text-sm text-muted">
            Freelancer invoicing without manual entries
          </p>
        </div>

        <div className="rounded-2xl border border-black/5 bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted uppercase tracking-wide">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted uppercase tracking-wide">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="font-mono text-sm pr-14"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-overdue">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-ink text-white hover:bg-ink/90 rounded-lg h-10"
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Log in'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/5" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-2 text-muted">or</span>
            </div>
          </div>

          <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-4 space-y-2.5">
            <p className="text-sm font-medium text-ink">Recruiter or investor?</p>
            <p className="text-xs text-muted leading-relaxed">
              Pre-loaded demo account with sample invoices and clients — no signup required.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-accent/30 text-accent hover:bg-accent/5 rounded-lg h-9 text-sm"
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