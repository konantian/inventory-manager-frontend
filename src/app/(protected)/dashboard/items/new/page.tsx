'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/useApiQuery';

interface InitialStockRow {
  store_id: string;
  quantity: number;
}

export default function CreateItemPage() {
  const { api } = useAuth();
  const router = useRouter();

  const categoriesQuery = useApiQuery(api ? () => api.listSkuCategories() : null);
  const storesQuery = useApiQuery(api ? () => api.listStores() : null);

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    price: 0,
  });
  const [initialStock, setInitialStock] = useState<InitialStockRow[]>([{ store_id: '', quantity: 0 }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!api) return;
    setError(null);

    // Validation
    if (!form.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (form.name.trim().length < 2) {
      setError('Item name must be at least 2 characters');
      return;
    }
    if (!form.category.trim()) {
      setError('Category is required');
      return;
    }
    if (form.category.trim().length < 2) {
      setError('Category must be at least 2 characters');
      return;
    }
    if (!form.description.trim()) {
      setError('Description is required');
      return;
    }
    if (form.description.trim().length < 5) {
      setError('Description must be at least 5 characters');
      return;
    }
    if (form.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    if (form.price > 1000000) {
      setError('Price must be less than 1,000,000');
      return;
    }

    // Validate initial stock if provided
    const selectedStores = new Set<string>();
    for (let i = 0; i < initialStock.length; i++) {
      const stock = initialStock[i];
      if (stock.store_id) {
        // Check for duplicate store
        if (selectedStores.has(stock.store_id)) {
          const storeName = (storesQuery.data?.items ?? []).find((s) => s.id === stock.store_id)?.name || 'Unknown';
          setError(`Duplicate store detected: ${storeName}. Each store can only be selected once.`);
          return;
        }
        selectedStores.add(stock.store_id);

        if (stock.quantity < 0) {
          setError(`Initial quantity for location ${i + 1} cannot be negative`);
          return;
        }
        if (stock.quantity > 1000000) {
          setError(`Initial quantity for location ${i + 1} must be less than 1,000,000`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const sku = await api.createSku({
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        price: form.price,
      });

      for (const stock of initialStock) {
        if (stock.store_id && stock.quantity > 0) {
          await api.createInventory({
            sku_id: sku.id,
            store_id: stock.store_id,
            quantity: stock.quantity,
          });
        }
      }

      router.replace(`/dashboard/items/${sku.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create SKU');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStockRow = (index: number, key: keyof InitialStockRow, value: string) => {
    setInitialStock((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [key]: key === 'quantity' ? Number(value) : value,
      };
      return copy;
    });
  };

  const addStockRow = () => setInitialStock((prev) => [...prev, { store_id: '', quantity: 0 }]);

  return (
    <form className="card space-y-6" onSubmit={handleSubmit}>
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Create SKU</p>
        <h1 className="text-2xl font-semibold text-white">New inventory item</h1>
        <p className="text-sm text-slate-400">The form calls POST /api/manager/skus and optional inventory endpoints.</p>
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
          <input
            list="categories"
            className="input"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            placeholder="Select or type a new category"
            required
          />
          <datalist id="categories">
            {(categoriesQuery.data?.categories ?? []).map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <p className="text-xs text-slate-400">
            Select an existing category or type a new one
          </p>
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

      <section className="space-y-3">
        <p className="text-sm text-slate-300">Initial inventory (optional)</p>
        {initialStock.map((row, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-2">
            <select
              className="input"
              value={row.store_id}
              onChange={(e) => updateStockRow(index, 'store_id', e.target.value)}
            >
              <option value="">Select store</option>
              {(storesQuery.data?.items ?? []).map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="input"
              min={0}
              value={row.quantity}
              onChange={(e) => updateStockRow(index, 'quantity', e.target.value)}
              placeholder="Quantity"
            />
          </div>
        ))}
        <button type="button" className="btn-secondary text-sm" onClick={addStockRow}>
          + Add location
        </button>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>
      )}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create item'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}

