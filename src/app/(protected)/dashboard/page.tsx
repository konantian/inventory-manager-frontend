'use client';

import Link from 'next/link';
import { ArrowUpRightIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/useApiQuery';
import { SKU } from '@/lib/types';

export default function DashboardPage() {
  const { api, user } = useAuth();

  const skuQuery = useApiQuery(
    api
      ? () =>
          api.listSkus({
            page: 1,
            page_size: 20,
            order: 'desc',
            sort_by: 'created_at',
          })
      : null,
  );

  const inventoryQuery = useApiQuery(
    api
      ? () =>
          api.listInventory({
            page: 1,
            page_size: 50,
            order: 'desc',
            sort_by: 'updated_at',
          })
      : null,
  );

  const userQuery = useApiQuery(api && user?.role === 'manager' ? () => api.listUsers({ page: 1, limit: 50 }) : null);

  const totalSkus = skuQuery.data?.total ?? 0;
  const totalInventoryItems = inventoryQuery.data?.total ?? 0;
  const totalUsers = user?.role === 'manager' ? userQuery.data?.total ?? 0 : undefined;
  const uniqueStores = new Set((inventoryQuery.data?.items ?? []).map((item) => item.store_id)).size;

  const lowStockItems = (inventoryQuery.data?.items ?? []).filter((item) => item.quantity < 25);

  const latestSkus = skuQuery.data?.items ?? [];
  const recentInventory = inventoryQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total SKUs" value={totalSkus} description="Managed across all stores" />
        <MetricCard title="Inventory Records" value={totalInventoryItems} description="Active store + SKU pairs" />
        <MetricCard title="Active Stores" value={uniqueStores} description="Stores with tracked inventory" />
        {user?.role === 'manager' ? (
          <MetricCard title="Active Users" value={totalUsers ?? 0} description="Manager + staff accounts" />
        ) : (
          <MetricCard
            title="Assigned Stores"
            value={uniqueStores || '—'}
            description="You can access these locations"
          />
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Inventory feed</p>
              <h2 className="text-xl font-semibold text-white">Recent adjustments</h2>
            </div>
            <Link href="/dashboard/items" className="btn-secondary text-sm">
              View inventory
            </Link>
          </header>
          <div className="space-y-3 text-sm">
            {recentInventory.slice(0, 8).map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-cyan-400/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.sku?.name ?? 'SKU'} · {item.store?.name ?? 'Store'}
                    </p>
                    <p className="text-xs text-slate-400">v{item.version} · {new Date(item.updated_at).toLocaleString()}</p>
                  </div>
                  <Link href={`/dashboard/items/${item.sku_id}`} className="text-cyan-300 hover:text-cyan-100">
                    <ArrowUpRightIcon className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">{item.quantity.toLocaleString()} units</p>
                <p className="text-xs text-slate-400">
                  Inventory ID: <span className="font-mono text-slate-300">{item.id.slice(0, 8)}</span>
                </p>
              </article>
            ))}
            {recentInventory.length === 0 && (
              <p className="text-sm text-slate-400">No inventory records yet. Create one from Items &gt; Inventory.</p>
            )}
          </div>
        </div>

        <div className="card">
          <header className="mb-4">
            <p className="text-xs uppercase tracking-[0.4em] text-rose-300">Low stock</p>
            <h2 className="text-xl font-semibold text-white">Attention needed</h2>
            <p className="text-sm text-slate-400">Threshold &lt; 25 units</p>
          </header>
          <div className="space-y-3">
            {lowStockItems.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/items/${item.sku_id}`}
                className="block rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-50 transition hover:border-rose-400/50"
              >
                <p className="font-semibold text-white">{item.sku?.name ?? item.sku_id}</p>
                <p className="text-xs text-rose-100">
                  {item.store?.name ?? item.store_id} · {item.quantity} units remaining
                </p>
              </Link>
            ))}
            {lowStockItems.length === 0 && (
              <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-50">
                All tracked inventory above the low stock threshold.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Latest SKUs</p>
              <h2 className="text-xl font-semibold text-white">Recently added</h2>
            </div>
            <Link href="/dashboard/items/new" className="btn-secondary text-sm">
              New SKU
            </Link>
          </header>
          <div className="space-y-3 text-sm">
            {latestSkus.slice(0, 6).map((sku: SKU) => (
              <Link
                key={sku.id}
                href={`/dashboard/items/${sku.id}`}
                className="block rounded-2xl border border-white/5 bg-white/5 p-4 hover:border-cyan-400/40"
              >
                <p className="font-semibold text-white">{sku.name}</p>
                <p className="text-xs text-slate-400">
                  {sku.category} · ${sku.price.toFixed(2)} · {new Date(sku.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
            {latestSkus.length === 0 && (
              <p className="text-sm text-slate-400">No SKUs yet. Create your first item to populate the catalog.</p>
            )}
          </div>
        </div>

        <div className="card">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Quick actions</p>
              <h2 className="text-xl font-semibold text-white">Stay productive</h2>
            </div>
          </header>
          <div className="space-y-3 text-sm text-slate-200">
            <ActionLink href="/dashboard/items/new" title="Add SKU" description="Create catalog entries with pricing." />
            <ActionLink
              href="/dashboard/items"
              title="Browse inventory"
              description="Filter across SKUs, stores, and stock levels."
            />
            {user?.role === 'manager' && (
              <>
                <ActionLink
                  href="/dashboard/users"
                  title="Manage people"
                  description="Provision manager/staff access and reset accounts."
                />
                <ActionLink
                  href="/dashboard/stores"
                  title="Configure stores"
                  description="Add retail locations and maintain staff assignments."
                />
              </>
            )}
            <ActionLink
              href="/dashboard/profile"
              title="Update password"
              description="Rotate your credentials regularly per policy."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, description }: { title: string; value: number | string; description: string }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

function ActionLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-cyan-400/40"
    >
      <div>
        <p className="text-base font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <ArrowUpRightIcon className="h-4 w-4 text-cyan-300" />
    </Link>
  );
}

