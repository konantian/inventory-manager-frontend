'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Store, User } from '@/lib/types';

export default function StoresPage() {
  const { api, user } = useAuth();
  const storesQuery = useApiQuery(api && user?.role === 'manager' ? () => api.listStores() : null);
  const usersQuery = useApiQuery(api && user?.role === 'manager' ? () => api.listUsers({ limit: 100 }) : null);

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeStaff, setStoreStaff] = useState<User[]>([]);
  const [staffAssociations, setStaffAssociations] = useState<Record<string, string>>({});
  const [newStore, setNewStore] = useState({ name: '', address: '' });
  const [staffUserId, setStaffUserId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stores = useMemo(() => storesQuery.data?.items ?? [], [storesQuery.data]);
  const selectedStore: Store | null = useMemo(() => {
    if (selectedStoreId) {
      return stores.find((store) => store.id === selectedStoreId) ?? stores[0] ?? null;
    }
    return stores[0] ?? null;
  }, [selectedStoreId, stores]);

  useEffect(() => {
    async function fetchStaff() {
      if (!api || !selectedStore) return;
      try {
        const response = await api.listStoreStaff(selectedStore.id);
        setStoreStaff(response.staff);
        // Unknown association IDs for historical rows; keep existing ones if we have them.
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load staff.');
      }
    }
    fetchStaff();
  }, [api, selectedStore]);

  const handleCreateStore = async () => {
    if (!api || !newStore.name || !newStore.address) return;
    setError(null);
    setMessage(null);
    try {
      const store = await api.createStore(newStore);
      setNewStore({ name: '', address: '' });
      storesQuery.reload();
      setSelectedStoreId(store.id);
      setMessage('Store created.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store');
    }
  };

  const handleDeleteStore = async (store: Store) => {
    if (!api) return;
    if (!confirm(`Delete ${store.name}?`)) return;
    setError(null);
    setMessage(null);
    try {
      await api.deleteStore(store.id);
      storesQuery.reload();
      setMessage('Store deleted.');
      if (selectedStore?.id === store.id) {
        setSelectedStoreId(null);
        setStoreStaff([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete store');
    }
  };

  const handleAddStaff = async () => {
    if (!api || !selectedStore || !staffUserId) return;
    setError(null);
    setMessage(null);
    try {
      const association = await api.addStaffToStore({ store_id: selectedStore.id, user_id: staffUserId });
      setStoreStaff((prev) => [...prev, association.user]);
      setStaffAssociations((prev) => ({ ...prev, [association.user_id]: association.id }));
      setStaffUserId('');
      setMessage('Staff member added to store.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add staff');
    }
  };

  const handleRemoveStaff = async (userId: string) => {
    if (!api) return;
    const associationId = staffAssociations[userId];
    if (!associationId) {
      setError('Association ID unknown. Try removing and re-adding to manage this user.');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await api.deleteStaffFromStore(associationId);
      setStoreStaff((prev) => prev.filter((staff) => staff.id !== userId));
      setMessage('Staff removed from store.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove staff');
    }
  };

  const availableUsers = useMemo(
    () =>
      (usersQuery.data?.users ?? []).filter((candidate) => !storeStaff.some((staff) => staff.id === candidate.id)),
    [storeStaff, usersQuery.data],
  );

  if (user?.role !== 'manager') {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">Store administration is limited to managers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Stores</p>
        <h1 className="text-2xl font-semibold text-white">Retail locations & staffing</h1>
        <p className="text-sm text-slate-400">
          Covers /api/manager/stores CRUD plus /api/manager/stores/staff association endpoints.
        </p>
      </section>
      {message && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>
      )}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card space-y-4 md:col-span-1">
          <h2 className="text-lg font-semibold text-white">Stores</h2>
          <div className="space-y-2">
            {stores.map((store) => (
              <div
                key={store.id}
                className={`rounded-2xl border p-3 text-sm ${
                  selectedStore?.id === store.id ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/5 bg-white/5'
                }`}
              >
                <button onClick={() => setSelectedStoreId(store.id)} className="w-full text-left text-white">
                  <p className="font-semibold">{store.name}</p>
                  <p className="text-xs text-slate-400">{store.address}</p>
                </button>
                <button
                  className="mt-2 text-xs text-rose-200"
                  onClick={() => handleDeleteStore(store)}
                >
                  Delete
                </button>
              </div>
            ))}
            {stores.length === 0 && <p className="text-sm text-slate-400">No stores yet.</p>}
          </div>
          <div className="space-y-2">
            <input
              className="input"
              placeholder="Store name"
              value={newStore.name}
              onChange={(e) => setNewStore((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Address"
              value={newStore.address}
              onChange={(e) => setNewStore((prev) => ({ ...prev, address: e.target.value }))}
            />
            <button className="btn-primary w-full" onClick={handleCreateStore}>
              Create store
            </button>
          </div>
        </div>

        <div className="card space-y-4 md:col-span-2">
          <h2 className="text-lg font-semibold text-white">Staffing</h2>
          {selectedStore ? (
            <>
              <p className="text-sm text-slate-400">
                Assign staff to <span className="text-white">{selectedStore.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <select
                  className="input w-64"
                  value={staffUserId}
                  onChange={(e) => setStaffUserId(e.target.value)}
                >
                  <option value="">Select user</option>
                  {availableUsers.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.username} · {candidate.role}
                    </option>
                  ))}
                </select>
                <button className="btn-primary" onClick={handleAddStaff}>
                  Add staff
                </button>
              </div>
              <div className="space-y-2">
                {storeStaff.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-2">
                    <div>
                      <p className="text-white">{staff.username}</p>
                      <p className="text-xs text-slate-400">{staff.email}</p>
                    </div>
                    <button
                      className={`text-xs ${
                        staffAssociations[staff.id]
                          ? 'text-rose-200 hover:text-rose-100'
                          : 'text-slate-500 cursor-not-allowed'
                      }`}
                      onClick={() => handleRemoveStaff(staff.id)}
                      disabled={!staffAssociations[staff.id]}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {storeStaff.length === 0 && <p className="text-sm text-slate-400">No staff assigned.</p>}
                <p className="text-xs text-slate-500">
                  Remove is enabled for associations created via this UI (ID sourced from POST response).
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Select a store to view staff.</p>
          )}
        </div>
      </section>
    </div>
  );
}

