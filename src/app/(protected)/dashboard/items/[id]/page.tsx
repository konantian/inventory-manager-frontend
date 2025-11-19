'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2Icon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/useApiQuery';
import { InventoryRecord, SKU, Store } from '@/lib/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { api, user } = useAuth();
  const skuId = params?.id as string;
  const [tab, setTab] = useState<'overview' | 'locations' | 'history'>('overview');
  const [selectedInventory, setSelectedInventory] = useState<InventoryRecord | null>(null);
  const [delta, setDelta] = useState(0);
  const [setQuantity, setSetQuantity] = useState<number | ''>('');
  const [storeSelection, setStoreSelection] = useState('');
  const [newInventoryQuantity, setNewInventoryQuantity] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const skuQuery = useApiQuery(api ? () => api.getSku(skuId) : null);
  const inventoryQuery = useApiQuery(
    api
      ? () =>
          api.listInventory({
            sku_id: skuId,
            page_size: 100,
            sort_by: 'updated_at',
            order: 'desc',
          })
      : null,
  );
  const storesQuery = useApiQuery(api && user?.role === 'manager' ? () => api.listStores() : null);

  const sku = skuQuery.data as SKU | undefined;
  const inventoryItems = inventoryQuery.data?.items ?? [];

  const stores: Store[] = useMemo(() => (storesQuery.data?.items ?? []), [storesQuery.data]);

  const selectInventory = useCallback(
    (record: InventoryRecord) => {
      setSelectedInventory(record);
      setDelta(0);
      setSetQuantity(record.quantity);
      setFeedback(null);
    },
    [],
  );

  const handleDeleteSku = () => {
    if (!api || !sku) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete SKU',
      message: `Delete SKU "${sku.name}"? This will permanently remove the SKU metadata and cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.deleteSku(sku.id);
          router.replace('/dashboard/items');
        } catch (error) {
          setFeedback(error instanceof Error ? error.message : 'Failed to delete SKU');
        }
      },
    });
  };

  const handleAdjust = async () => {
    if (!api || !selectedInventory || delta === 0) return;
    try {
      const updated = await api.adjustInventory(selectedInventory.id, { delta_quantity: delta });
      selectInventory(updated);
      inventoryQuery.reload();
      setFeedback('Quantity adjusted successfully.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to adjust quantity');
    }
  };

  const handleSetQuantity = async () => {
    if (!api || !selectedInventory || setQuantity === '') return;
    try {
      const updated = await api.updateInventory(selectedInventory.id, { quantity: setQuantity });
      selectInventory(updated);
      inventoryQuery.reload();
      setFeedback('Quantity updated.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to update quantity');
    }
  };

  const handleDeleteInventory = (record: InventoryRecord) => {
    if (!api) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Inventory Record',
      message: `Delete inventory record for "${record.store?.name ?? record.store_id}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.deleteInventory(record.id);
          inventoryQuery.reload();
          if (selectedInventory?.id === record.id) {
            setSelectedInventory(null);
          }
        } catch (error) {
          setFeedback(error instanceof Error ? error.message : 'Failed to delete inventory record');
        }
      },
    });
  };

  const handleCreateInventory = async () => {
    if (!api || !sku) return;
    if (!storeSelection) {
      setFeedback('Select a store before creating inventory.');
      return;
    }
    try {
      await api.createInventory({
        sku_id: sku.id,
        store_id: storeSelection,
        quantity: newInventoryQuantity,
      });
      inventoryQuery.reload();
      setStoreSelection('');
      setNewInventoryQuantity(0);
      setFeedback('Inventory record created.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to create inventory record');
    }
  };

  if (!sku) {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">Loading SKU…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">SKU</p>
            <h1 className="text-3xl font-semibold text-white">{sku.name}</h1>
            <p className="text-sm text-slate-400">{sku.description || 'No description provided.'}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/items/${sku.id}/edit`} className="btn-secondary">
              Edit
            </Link>
            {user?.role === 'manager' && (
              <button
                onClick={handleDeleteSku}
                className="flex items-center gap-2 rounded-2xl border border-rose-500/40 px-4 py-2 text-sm text-rose-100"
              >
                <Trash2Icon className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-xs uppercase text-slate-500">Category</p>
            <p className="text-lg font-semibold text-white">{sku.category || '—'}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-xs uppercase text-slate-500">Price</p>
            <p className="text-lg font-semibold text-white">${sku.price.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-xs uppercase text-slate-500">Version</p>
            <p className="text-lg font-semibold text-white">v{sku.version}</p>
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          {(['overview', 'locations', 'history'] as const).map((tabKey) => (
            <button
              key={tabKey}
              className={`rounded-2xl px-4 py-2 capitalize ${
                tab === tabKey ? 'bg-cyan-500/20 text-white' : 'bg-white/5 text-slate-400'
              }`}
              onClick={() => setTab(tabKey)}
            >
              {tabKey}
            </button>
          ))}
        </div>
      </section>

      {feedback && (
        <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 p-3 text-sm text-cyan-100">{feedback}</div>
      )}

      {tab === 'overview' && (
        <section className="card space-y-4">
          <header>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Quantities by store</p>
            <h2 className="text-xl font-semibold text-white">Active locations</h2>
          </header>
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((record) => (
                  <tr key={record.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-200">{record.store?.name ?? record.store_id}</td>
                    <td className="px-4 py-3 text-2xl font-semibold text-white">{record.quantity}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(record.updated_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-200"
                        onClick={() => selectInventory(record)}
                      >
                        Manage
                      </button>
                      {user?.role === 'manager' && (
                        <button
                          className="ml-2 rounded-xl border border-rose-500/40 px-3 py-1 text-xs text-rose-100"
                          onClick={() => handleDeleteInventory(record)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {inventoryItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No inventory yet for this SKU.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedInventory && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-xs uppercase text-slate-500">Adjust delta</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    className="input"
                    value={delta}
                    onChange={(e) => setDelta(Number(e.target.value))}
                    placeholder="± quantity"
                  />
                  <button className="btn-primary" onClick={handleAdjust}>
                    Apply
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">POST /api/inventory/{selectedInventory.id}/adjust</p>
              </div>
              {user?.role === 'manager' && (
                <>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="text-xs uppercase text-slate-500">Set quantity</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        className="input"
                        value={setQuantity}
                        onChange={(e) => setSetQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                      <button className="btn-primary" onClick={handleSetQuantity}>
                        Save
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">PUT /api/manager/inventory/{selectedInventory.id}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="text-xs uppercase text-slate-500">Delete record</p>
                    <button
                      className="mt-3 w-full rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100"
                      onClick={() => handleDeleteInventory(selectedInventory)}
                    >
                      Remove inventory
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {tab === 'locations' && (
        <section className="card space-y-4">
          <header>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Store coverage</p>
            <h2 className="text-xl font-semibold text-white">Add or move inventory</h2>
          </header>
          {user?.role === 'manager' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-3">
                <p className="text-sm text-slate-300">Create new inventory record</p>
                <select className="input" value={storeSelection} onChange={(e) => setStoreSelection(e.target.value)}>
                  <option value="">Select store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="input"
                  min={0}
                  value={newInventoryQuantity}
                  onChange={(e) => setNewInventoryQuantity(Number(e.target.value))}
                  placeholder="Quantity"
                />
                <button className="btn-primary w-full" onClick={handleCreateInventory}>
                  Create inventory
                </button>
                <p className="text-xs text-slate-400">POST /api/manager/inventory</p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-sm text-slate-300">Stores with inventory</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {inventoryItems.map((record) => (
                    <li key={record.id} className="flex justify-between rounded-xl border border-white/5 px-3 py-2">
                      <span>{record.store?.name ?? record.store_id}</span>
                      <span className="font-mono">{record.quantity}</span>
                    </li>
                  ))}
                  {inventoryItems.length === 0 && <li>No stores yet.</li>}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Only managers can modify store assignments.</p>
          )}
        </section>
      )}

      {tab === 'history' && (
        <section className="card space-y-4">
          <header>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Updates</p>
            <h2 className="text-xl font-semibold text-white">Recent changes</h2>
          </header>
          <div className="space-y-3">
            {inventoryItems.map((record) => (
              <div key={record.id} className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-slate-200">
                <p className="text-white">
                  {record.store?.name ?? record.store_id} · {record.quantity} units
                </p>
                <p className="text-xs text-slate-400">
                  v{record.version} · {new Date(record.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
            {inventoryItems.length === 0 && <p className="text-sm text-slate-400">No history yet.</p>}
          </div>
        </section>
      )}

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

