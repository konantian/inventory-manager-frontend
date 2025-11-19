'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Store, User } from '@/lib/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';

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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

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
    if (!api) return;
    setError(null);
    setMessage(null);

    // Validation
    if (!newStore.name.trim()) {
      setError('Store name is required');
      return;
    }
    if (newStore.name.trim().length < 2) {
      setError('Store name must be at least 2 characters');
      return;
    }
    if (!newStore.address.trim()) {
      setError('Store address is required');
      return;
    }
    if (newStore.address.trim().length < 5) {
      setError('Store address must be at least 5 characters');
      return;
    }

    try {
      const store = await api.createStore({
        name: newStore.name.trim(),
        address: newStore.address.trim(),
      });
      setNewStore({ name: '', address: '' });
      storesQuery.reload();
      setSelectedStoreId(store.id);
      setMessage('Store created.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store');
    }
  };

  const handleDeleteStore = (store: Store) => {
    if (!api) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Store',
      message: `Delete store "${store.name}"? This action cannot be undone.`,
      onConfirm: async () => {
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
      },
    });
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
      <section className="space-y-4">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">Store Management</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-sm text-slate-400">Select Store</label>
              <select
                className="input w-full"
                value={selectedStore?.id ?? ''}
                onChange={(e) => setSelectedStoreId(e.target.value)}
              >
                <option value="">Select a store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.address}
                  </option>
                ))}
              </select>
            </div>
            {selectedStore && (
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{selectedStore.name}</p>
                    <p className="text-sm text-slate-300">{selectedStore.address}</p>
                    <p className="mt-1 text-xs text-slate-400">ID: {selectedStore.id}</p>
                  </div>
                  <button
                    className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                    onClick={() => handleDeleteStore(selectedStore)}
                  >
                    Delete Store
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">Create New Store</h2>
          <div className="grid gap-3 md:grid-cols-2">
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
          </div>
          <button className="btn-primary" onClick={handleCreateStore}>
            Create store
          </button>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">Store Staffing</h2>
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
            <p className="text-sm text-slate-400">Select a store to manage staffing.</p>
          )}
        </div>
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

