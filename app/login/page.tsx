// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase'; // adjust to your existing client path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEMO_EMAIL = 'demo@tokenpay.app';
const DEMO_PASSWORD = 'demo@2026';

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

    router.push('/dashboard'); // adjust to your actual post-login route
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white text-xl font-bold">
            T
          </div>
          <h1 className="text-2xl font-bold">TokenPay</h1>
          <p className="text-sm text-muted-foreground">
            Freelancer invoicing without manual entries
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>

          <div className="rounded-xl border border-dashed bg-muted/40 p-4 space-y-2">
            <p className="text-sm font-medium">🎯 Recruiter? Try the live demo</p>
            <p className="text-xs text-muted-foreground">
              Pre-loaded account with sample invoices, clients, and data — no signup needed.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log in as demo user →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}