'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/useApiQuery';
import { InventoryRecord } from '@/lib/types';

const WARNING_THRESHOLD = 25;

export default function AlertsPage() {
  const { api } = useAuth();
  const inventoryQuery = useApiQuery(
    api
      ? () =>
          api.listInventory({
            page: 1,
            page_size: 100,
            order: 'asc',
            sort_by: 'quantity',
          })
      : null,
  );
  const [deltaById, setDeltaById] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const alerts =
    inventoryQuery.data?.items.filter((item) => item.quantity <= WARNING_THRESHOLD).map((record) => {
      const severity = record.quantity <= 0 ? 'critical' : 'warning';
      return { record, severity };
    }) ?? [];

  const handleAdjust = async (record: InventoryRecord) => {
    if (!api) return;
    const delta = deltaById[record.id];
    if (!delta) {
      setFeedback('Enter a delta before adjusting.');
      return;
    }
    try {
      await api.adjustInventory(record.id, { delta_quantity: delta });
      setFeedback('Inventory adjusted.');
      setDeltaById((prev) => ({ ...prev, [record.id]: 0 }));
      inventoryQuery.reload();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Adjustment failed');
    }
  };

  return (
    <div className="space-y-6">
      <section className="card space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Alerts</p>
        <h1 className="text-2xl font-semibold text-white">Low stock and outages</h1>
        <p className="text-sm text-slate-400">
          Derived from GET /api/inventory (quantity ≤ {WARNING_THRESHOLD}). Use the adjust endpoint to resolve.
        </p>
      </section>
      {feedback && (
        <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 p-3 text-sm text-cyan-100">{feedback}</div>
      )}
      <section className="space-y-4">
        {alerts.map(({ record, severity }) => (
          <article
            key={record.id}
            className={`card border ${
              severity === 'critical' ? 'border-rose-500/40 bg-rose-500/10' : 'border-amber-400/40 bg-amber-500/10'
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-white">
                  {severity === 'critical' ? (
                    <AlertTriangleIcon className="h-4 w-4 text-rose-300" />
                  ) : (
                    <AlertTriangleIcon className="h-4 w-4 text-amber-200" />
                  )}
                  <span className="uppercase tracking-[0.4em] text-xs">
                    {severity === 'critical' ? 'Critical' : 'Warning'}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {record.sku?.name ?? record.sku_id} @ {record.store?.name ?? record.store_id}
                </h2>
                <p className="text-sm text-white">
                  Quantity: <span className="font-mono">{record.quantity}</span>
                </p>
                <p className="text-xs text-white/70">Updated {new Date(record.updated_at).toLocaleString()}</p>
              </div>
              <div className="space-y-2 text-sm text-white">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="input w-32 bg-white/10"
                    placeholder="Δ qty"
                    value={deltaById[record.id] ?? 0}
                    onChange={(e) => setDeltaById((prev) => ({ ...prev, [record.id]: Number(e.target.value) }))}
                  />
                  <button className="btn-primary" onClick={() => handleAdjust(record)}>
                    Adjust
                  </button>
                </div>
                <p className="text-xs text-white/70">
                  POST /api/inventory/{record.id}/adjust · Cannot drop below zero.
                </p>
                <div className="flex gap-2 text-xs">
                  <Link href={`/dashboard/items/${record.sku_id}`} className="btn-secondary text-white">
                    View item
                  </Link>
                  <Link href="/dashboard/items" className="btn-secondary text-white">
                    Inventory list
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
        {alerts.length === 0 && (
          <div className="card flex items-center gap-3 text-emerald-100">
            <CheckCircleIcon className="h-5 w-5" />
            <p>All inventory above the alert threshold.</p>
          </div>
        )}
      </section>
    </div>
  );
}

