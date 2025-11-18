'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/auth-context';

export default function ProfilePage() {
  const { user, api, refreshProfile } = useAuth();
  const [form, setForm] = useState({ old_password: '', new_password: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!api) return;
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const response = await api.changePassword(form);
      setMessage(response.message);
      setForm({ old_password: '', new_password: '' });
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Profile</p>
        <h1 className="text-2xl font-semibold text-white">{user.username}</h1>
        <p className="text-sm text-slate-400">{user.email}</p>
        <p className="text-xs text-slate-500">
          User ID: <span className="font-mono">{user.id}</span>
        </p>
      </section>

      <form className="card space-y-4" onSubmit={handleSubmit}>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Security</p>
          <h2 className="text-xl font-semibold text-white">Change password</h2>
          <p className="text-sm text-slate-400">PUT /api/profile/password</p>
        </div>
        <div className="space-y-2">
          <label className="label">Current password</label>
          <input
            type="password"
            className="input"
            value={form.old_password}
            onChange={(e) => setForm((prev) => ({ ...prev, old_password: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="label">New password</label>
          <input
            type="password"
            className="input"
            minLength={8}
            value={form.new_password}
            onChange={(e) => setForm((prev) => ({ ...prev, new_password: e.target.value }))}
            required
          />
        </div>
        {message && (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

