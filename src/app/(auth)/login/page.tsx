'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useServer } from '@/context/server-context';

export default function LoginPage() {
  const { login, token, loading } = useAuth();
  const { selectedServer, setSelectedServer, servers } = useServer();
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('adminadmin');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && token) {
      router.replace('/dashboard');
    }
  }, [loading, token, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    // Validation
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      await login({ username, password, rememberMe });
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Inventory Manager</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">Use your backend credentials to continue.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label className="label" htmlFor="server">
              API Server
            </label>
            <select
              id="server"
              className="input cursor-pointer"
              value={selectedServer.id}
              onChange={(e) => {
                const server = servers.find((s) => s.id === e.target.value);
                if (server) setSelectedServer(server);
              }}
            >
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name} ({server.url})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-cyan-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <p className="text-xs text-slate-500">Default admin: admin/adminadmin</p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

