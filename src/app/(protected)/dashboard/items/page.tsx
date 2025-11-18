'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Trash2Icon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  CreateInventoryRequest,
  InventoryRecord,
  SKU,
  SKUListFilters,
  Store,
  StoreListResponse,
} from '@/lib/types';

export default function ItemsPage() {
  const { api, user } = useAuth();
  const [skuFilters, setSkuFilters] = useState<SKUListFilters>({
    page: 1,
    page_size: 20,
    order: 'desc',
    sort_by: 'created_at',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryFilters, setInventoryFilters] = useState({
    page: 1,
    page_size: 20,
    store_id: '',
    sku_id: '',
    sort_by: 'updated_at' as 'quantity' | 'created_at' | 'updated_at',
    order: 'desc' as 'asc' | 'desc',
  });

  const [selectedInventory, setSelectedInventory] = useState<InventoryRecord | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [setQuantity, setSetQuantity] = useState<number | ''>('');
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [creatingInventory, setCreatingInventory] = useState(false);
  const [newInventory, setNewInventory] = useState<CreateInventoryRequest>({
    sku_id: '',
    store_id: '',
    quantity: 0,
  });

  const skuFetcher = useCallback(() => (api ? api.listSkus(skuFilters) : Promise.resolve(null)), [api, skuFilters]);
  const skuQuery = useApiQuery(api ? skuFetcher : null);

  const categoriesQuery = useApiQuery(
    api ? () => api.listSkuCategories() : null,
    {
      enabled: Boolean(api),
    },
  );

  const storesQuery = useApiQuery(
    api && user?.role === 'manager' ? () => api.listStores() : null,
    {
      enabled: Boolean(api && user?.role === 'manager'),
    },
  );

  const inventoryFetcher = useCallback(
    () =>
      api
        ? api.listInventory({
            ...inventoryFilters,
            store_id: inventoryFilters.store_id || undefined,
            sku_id: inventoryFilters.sku_id || undefined,
          })
        : Promise.resolve(null),
    [api, inventoryFilters],
  );
  const inventoryQuery = useApiQuery(api ? inventoryFetcher : null);

  useEffect(() => {
    if (!selectedInventory && inventoryQuery.data?.items?.length) {
      setSelectedInventory(inventoryQuery.data.items[0]);
    }
  }, [inventoryQuery.data, selectedInventory]);

  const handleSearch = () => {
    setSkuFilters((prev) => ({
      ...prev,
      page: 1,
      search: searchTerm || undefined,
    }));
  };

  const handleInventorySelect = async (record: InventoryRecord) => {
    if (!api) return;
    try {
      const fullRecord = await api.getInventoryById(record.id);
      setSelectedInventory(fullRecord);
      setSetQuantity(fullRecord.quantity);
      setAdjustQuantity(0);
      setInventoryError(null);
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : 'Failed to load inventory record.');
    }
  };

  const handleAdjust = async () => {
    if (!api || !selectedInventory) return;
    if (!adjustQuantity) return;
    try {
      const updated = await api.adjustInventory(selectedInventory.id, { delta_quantity: adjustQuantity });
      setSelectedInventory(updated);
      setAdjustQuantity(0);
      inventoryQuery.reload();
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : 'Failed to adjust inventory');
    }
  };

  const handleSetQuantity = async () => {
    if (!api || !selectedInventory || setQuantity === '') return;
    try {
      const updated = await api.updateInventory(selectedInventory.id, { quantity: setQuantity });
      setSelectedInventory(updated);
      inventoryQuery.reload();
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : 'Failed to update inventory');
    }
  };

  const handleDeleteInventory = async () => {
    if (!api || !selectedInventory) return;
    try {
      await api.deleteInventory(selectedInventory.id);
      setSelectedInventory(null);
      inventoryQuery.reload();
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : 'Failed to delete inventory');
    }
  };

  const handleCreateInventory = async () => {
    if (!api) return;
    setCreatingInventory(true);
    setInventoryError(null);
    try {
      await api.createInventory(newInventory);
      setNewInventory({ sku_id: '', store_id: '', quantity: 0 });
      inventoryQuery.reload();
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : 'Failed to create inventory record');
    } finally {
      setCreatingInventory(false);
    }
  };

  const handleDeleteSku = async (sku: SKU) => {
    if (!api) return;
    if (!confirm(`Delete SKU ${sku.name}? This cannot be undone.`)) return;
    try {
      await api.deleteSku(sku.id);
      skuQuery.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete SKU');
    }
  };

  const stores: Store[] = useMemo(
    () => (storesQuery.data as StoreListResponse | null)?.items ?? [],
    [storesQuery.data],
  );

  return (
    <div className="space-y-8">
      <section className="card space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Catalog</p>
            <h1 className="text-2xl font-semibold text-white">SKU directory</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              placeholder="Search by SKU or name"
              className="input w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <select
              className="input w-40"
              value={skuFilters.category ?? ''}
              onChange={(e) =>
                setSkuFilters((prev) => ({ ...prev, category: e.target.value || undefined, page: 1 }))
              }
            >
              <option value="">All categories</option>
              {(categoriesQuery.data?.categories ?? []).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              className="input w-32"
              value={skuFilters.page_size}
              onChange={(e) => setSkuFilters((prev) => ({ ...prev, page_size: Number(e.target.value), page: 1 }))}
            >
              {[20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <button className="btn-primary" onClick={handleSearch}>
              Apply
            </button>
            {user?.role === 'manager' && (
              <Link href="/dashboard/items/new" className="btn-secondary">
                + New SKU
              </Link>
            )}
          </div>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(skuQuery.data?.items ?? []).map((sku) => (
                <tr key={sku.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{sku.name}</div>
                    <div className="text-xs text-slate-400">{sku.id}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-200">{sku.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-100">${sku.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(sku.updated_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/items/${sku.id}`} className="btn-secondary px-3 py-1">
                        View
                      </Link>
                      {user?.role === 'manager' && (
                        <>
                          <Link href={`/dashboard/items/${sku.id}/edit`} className="btn-secondary px-3 py-1">
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteSku(sku)}
                            className="rounded-xl border border-rose-500/40 px-3 py-1 text-rose-200 hover:bg-rose-500/10"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {skuQuery.data?.items?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No SKUs match this query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {skuFilters.page} of {skuQuery.data?.total_pages ?? 1}
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary px-3 py-1 text-xs disabled:opacity-50"
              disabled={skuFilters.page === 1}
              onClick={() => setSkuFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))}
            >
              Previous
            </button>
            <button
              className="btn-secondary px-3 py-1 text-xs disabled:opacity-50"
              disabled={skuFilters.page === (skuQuery.data?.total_pages ?? 1)}
              onClick={() =>
                setSkuFilters((prev) => ({
                  ...prev,
                  page: Math.min((skuQuery.data?.total_pages ?? 1), (prev.page ?? 1) + 1),
                }))
              }
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Inventory</p>
              <h2 className="text-xl font-semibold text-white">Real-time stock</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <select
                className="input w-40"
                value={inventoryFilters.store_id}
                onChange={(e) => setInventoryFilters((prev) => ({ ...prev, store_id: e.target.value, page: 1 }))}
              >
                <option value="">All stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <select
                className="input w-40"
                value={inventoryFilters.sku_id}
                onChange={(e) => setInventoryFilters((prev) => ({ ...prev, sku_id: e.target.value, page: 1 }))}
              >
                <option value="">All SKUs</option>
                {(skuQuery.data?.items ?? []).map((sku) => (
                  <option key={sku.id} value={sku.id}>
                    {sku.name}
                  </option>
                ))}
              </select>
              <select
                className="input w-32"
                value={inventoryFilters.page_size}
                onChange={(e) => setInventoryFilters((prev) => ({ ...prev, page_size: Number(e.target.value), page: 1 }))}
              >
                {[20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          </header>

          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(inventoryQuery.data?.items ?? []).map((record) => (
                  <tr key={record.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-200">{record.store?.name ?? record.store_id}</td>
                    <td className="px-4 py-3 text-slate-200">{record.sku?.name ?? record.sku_id}</td>
                    <td className="px-4 py-3 text-lg font-semibold text-white">{record.quantity}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(record.updated_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className={`rounded-xl px-3 py-1 text-xs ${
                          selectedInventory?.id === record.id
                            ? 'border border-cyan-500/50 text-cyan-100'
                            : 'border border-white/10 text-slate-300 hover:border-cyan-300/40'
                        }`}
                        onClick={() => handleInventorySelect(record)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {inventoryQuery.data?.items?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No inventory records match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {inventoryFilters.page} of {inventoryQuery.data?.total_pages ?? 1}
            </span>
            <div className="flex gap-2">
              <button
                className="btn-secondary px-3 py-1 text-xs disabled:opacity-50"
                disabled={inventoryFilters.page === 1}
                onClick={() => setInventoryFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              >
                Previous
              </button>
              <button
                className="btn-secondary px-3 py-1 text-xs disabled:opacity-50"
                disabled={inventoryFilters.page === (inventoryQuery.data?.total_pages ?? 1)}
                onClick={() =>
                  setInventoryFilters((prev) => ({
                    ...prev,
                    page: Math.min((inventoryQuery.data?.total_pages ?? 1), prev.page + 1),
                  }))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <header>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Detail</p>
            <h3 className="text-xl font-semibold text-white">Inventory controls</h3>
          </header>

          {inventoryError && (
            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">{inventoryError}</div>
          )}

          {selectedInventory ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Store</p>
                <p className="text-lg font-semibold text-white">{selectedInventory.store?.name ?? selectedInventory.store_id}</p>
                <p className="text-sm text-slate-400">SKU</p>
                <p className="text-lg font-semibold text-white">{selectedInventory.sku?.name ?? selectedInventory.sku_id}</p>
                <p className="text-sm text-slate-400">Quantity</p>
                <p className="text-3xl font-bold text-white">{selectedInventory.quantity}</p>
                <p className="text-xs text-slate-500">Version {selectedInventory.version}</p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Adjust delta</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    className="input"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                    placeholder="e.g. -5 or 10"
                  />
                  <button className="btn-primary" onClick={handleAdjust}>
                    Apply
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  This calls <code className="font-mono text-cyan-200">POST /api/inventory/:id/adjust</code>.
                </p>
              </div>

              {user?.role === 'manager' && (
                <>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Set quantity</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        className="input"
                        value={setQuantity}
                        onChange={(e) => setSetQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="New quantity"
                      />
                      <button className="btn-primary" onClick={handleSetQuantity}>
                        Update
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Direct set via <code className="font-mono text-cyan-200">PUT /api/manager/inventory/:id</code>.
                    </p>
                  </div>

                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
                    onClick={handleDeleteInventory}
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Delete record
                  </button>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Select an inventory record to manage quantities.</p>
          )}

          {user?.role === 'manager' && (
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Create inventory</p>
              <div className="mt-4 space-y-3 text-sm">
                <select
                  className="input"
                  value={newInventory.store_id}
                  onChange={(e) => setNewInventory((prev) => ({ ...prev, store_id: e.target.value }))}
                >
                  <option value="">Select store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <select
                  className="input"
                  value={newInventory.sku_id}
                  onChange={(e) => setNewInventory((prev) => ({ ...prev, sku_id: e.target.value }))}
                >
                  <option value="">Select SKU</option>
                  {(skuQuery.data?.items ?? []).map((sku) => (
                    <option key={sku.id} value={sku.id}>
                      {sku.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="input"
                  value={newInventory.quantity}
                  onChange={(e) => setNewInventory((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                  placeholder="Initial quantity"
                  min={0}
                />
                <button className="btn-primary w-full" onClick={handleCreateInventory} disabled={creatingInventory}>
                  {creatingInventory ? 'Creating…' : 'Create inventory record'}
                </button>
                <p className="text-xs text-slate-400">
                  Uses <code className="font-mono text-cyan-200">POST /api/manager/inventory</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

