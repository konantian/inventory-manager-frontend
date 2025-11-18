'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/useApiQuery';
import { InventoryRecord } from '@/lib/types';

export default function AuditPage() {
  const { api, user } = useAuth();
  const [filters, setFilters] = useState({
    store_id: '',
    sku_id: '',
    start: '',
    end: '',
  });
  const inventoryQuery = useApiQuery(
    api
      ? () =>
          api.listInventory({
            page: 1,
            page_size: 100,
            order: 'desc',
            sort_by: 'updated_at',
          })
      : null,
  );
  const storesQuery = useApiQuery(api && user?.role === 'manager' ? () => api.listStores() : null);
  const skuQuery = useApiQuery(api ? () => api.listSkus({ page: 1, page_size: 100 }) : null);

  const filteredEntries = useMemo(() => {
    const records = inventoryQuery.data?.items ?? [];
    return records.filter((record) => {
      const matchesStore = filters.store_id ? record.store_id === filters.store_id : true;
      const matchesSku = filters.sku_id ? record.sku_id === filters.sku_id : true;
      const updatedAt = new Date(record.updated_at);
      const matchesStart = filters.start ? updatedAt >= new Date(filters.start) : true;
      const matchesEnd = filters.end ? updatedAt <= new Date(filters.end) : true;
      return matchesStore && matchesSku && matchesStart && matchesEnd;
    });
  }, [filters, inventoryQuery.data]);

  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Audit log</p>
            <h1 className="text-2xl font-semibold text-white">Inventory adjustment timeline</h1>
            <p className="text-sm text-slate-400">
              Data derived from GET /api/inventory. Filter by store, SKU, or time range.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="input w-44"
              value={filters.store_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, store_id: e.target.value }))}
            >
              <option value="">All stores</option>
              {(storesQuery.data?.items ?? []).map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <select
              className="input w-44"
              value={filters.sku_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, sku_id: e.target.value }))}
            >
              <option value="">All SKUs</option>
              {(skuQuery.data?.items ?? []).map((sku) => (
                <option key={sku.id} value={sku.id}>
                  {sku.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="input"
              value={filters.start}
              onChange={(e) => setFilters((prev) => ({ ...prev, start: e.target.value }))}
            />
            <input
              type="date"
              className="input"
              value={filters.end}
              onChange={(e) => setFilters((prev) => ({ ...prev, end: e.target.value }))}
            />
            <button className="btn-secondary text-sm" onClick={() => setFilters({ store_id: '', sku_id: '', start: '', end: '' })}>
              Clear
            </button>
          </div>
        </header>
      </section>

      <section className="space-y-4">
        {filteredEntries.map((record: InventoryRecord) => (
          <article key={record.id} className="card flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-400">
                {record.store?.name ?? record.store_id} · {record.sku?.name ?? record.sku_id}
              </p>
              <p className="text-2xl font-semibold text-white">{record.quantity} units</p>
              <p className="text-xs text-slate-500">v{record.version} · {new Date(record.updated_at).toLocaleString()}</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>ID: {record.id}</p>
              <p>Created: {new Date(record.created_at).toLocaleString()}</p>
            </div>
          </article>
        ))}
        {filteredEntries.length === 0 && (
          <div className="card">
            <p className="text-sm text-slate-400">No entries for this filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}

