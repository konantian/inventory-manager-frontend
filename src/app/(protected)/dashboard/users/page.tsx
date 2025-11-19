'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/useApiQuery';
import { User, UserRole } from '@/lib/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function UsersPage() {
  const { api, user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
  });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', role: 'staff' as UserRole });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const usersQuery = useApiQuery(
    api && user?.role === 'manager' ? () => api.listUsers({ page, limit }) : null,
  );

  if (user?.role !== 'manager') {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">Only managers can manage users.</p>
      </div>
    );
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!api) return;
    setError(null);
    setMessage(null);

    // Validation
    if (!createForm.username.trim()) {
      setError('Username is required');
      return;
    }
    if (createForm.username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(createForm.username.trim())) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }
    if (!createForm.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (!createForm.password) {
      setError('Password is required');
      return;
    }
    if (createForm.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await api.createUser({
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      setCreateForm({ username: '', email: '', password: '', role: 'staff' });
      setMessage('User created.');
      usersQuery.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const startEdit = (selected: User) => {
    setEditUser(selected);
    setEditForm({ username: selected.username, email: selected.email, role: selected.role });
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!api || !editUser) return;
    setError(null);
    setMessage(null);

    // Validation
    if (!editForm.username.trim()) {
      setError('Username is required');
      return;
    }
    if (editForm.username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(editForm.username.trim())) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }
    if (!editForm.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await api.updateUser({
        target_id: editUser.id,
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
      });
      setMessage('User updated.');
      setEditUser(null);
      usersQuery.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDelete = (selected: User) => {
    if (!api) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: `Delete user "${selected.username}"? This action cannot be undone.`,
      onConfirm: async () => {
        setError(null);
        setMessage(null);
        try {
          await api.deleteUser(selected.id);
          setMessage('User deleted.');
          usersQuery.reload();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete user');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <section className="card space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Users</p>
        <h1 className="text-2xl font-semibold text-white">Account management</h1>
        <p className="text-sm text-slate-400">All actions map to the /api/manager/users endpoints.</p>
      </section>
      {message && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>
      )}
      <section className="card space-y-4">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Directory</p>
            <h2 className="text-xl font-semibold text-white">Existing accounts</h2>
          </div>
          <div className="flex gap-2 text-sm">
            <select className="input" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {[20, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value} / page
                </option>
              ))}
            </select>
            <button
              className="btn-secondary"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>
            <button
              className="btn-secondary"
              disabled={page === (usersQuery.data?.totalPages ?? 1)}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </header>
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(usersQuery.data?.users ?? []).map((account) => (
                <tr key={account.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white">{account.username}</td>
                  <td className="px-4 py-3 text-slate-300">{account.email}</td>
                  <td className="px-4 py-3 capitalize text-slate-200">{account.role}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-secondary mr-2 px-3 py-1 text-xs" onClick={() => startEdit(account)}>
                      Edit
                    </button>
                    {account.username !== 'admin' && (
                      <button
                        className="rounded-xl border border-rose-500/40 px-3 py-1 text-xs text-rose-100"
                        onClick={() => handleDelete(account)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <form className="card space-y-3" onSubmit={handleCreate}>
          <p className="text-sm text-slate-300">Create user</p>
          <input
            className="input"
            placeholder="Username"
            value={createForm.username}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <select
            className="input"
            value={createForm.role}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
          </select>
          <button type="submit" className="btn-primary w-full">
            Create
          </button>
        </form>

        <form className="card space-y-3" onSubmit={handleUpdate}>
          <p className="text-sm text-slate-300">Edit user</p>
          {editUser ? (
            <>
              <input className="input" value={editUser.id} disabled />
              <input
                className="input"
                value={editForm.username}
                onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
              <input
                className="input"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <select
                className="input"
                value={editForm.role}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  Update
                </button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setEditUser(null)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Select a user from the table to edit.</p>
          )}
        </form>
      </section>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

