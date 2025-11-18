'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/useApiQuery';
import { SKU } from '@/lib/types';

export default function EditItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { api } = useAuth();
  const skuId = params?.id as string;
  const skuQuery = useApiQuery(api ? () => api.getSku(skuId) : null);
  const categoriesQuery = useApiQuery(api ? () => api.listSkuCategories() : null);

  const sku = skuQuery.data as SKU | undefined;

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    price: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sku) {
      setForm({
        name: sku.name,
        category: sku.category,
        description: sku.description ?? '',
        price: sku.price,
      });
    }
  }, [sku]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!api) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.updateSku(skuId, form);
      router.replace(`/dashboard/items/${skuId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SKU');
    } finally {
      setSubmitting(false);
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
    <form className="card space-y-6" onSubmit={handleSubmit}>
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Edit SKU</p>
        <h1 className="text-2xl font-semibold text-white">{sku.name}</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="label">Category</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            required
          >
            <option value="">Select category</option>
            {(categoriesQuery.data?.categories ?? []).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="label">Description</label>
          <textarea
            className="input min-h-[120px]"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <label className="label">Price</label>
          <input
            type="number"
            className="input"
            min={0}
            step={0.01}
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
            required
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>
      )}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}

