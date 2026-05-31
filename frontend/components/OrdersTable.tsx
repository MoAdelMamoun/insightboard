'use client';

import { useMemo, useState } from 'react';
import type { Order } from '@/lib/types';
import { moneyExact, num } from '@/lib/format';

type SortKey = 'date' | 'customer' | 'category' | 'region' | 'quantity' | 'revenue';
const PAGE_SIZE = 12;

const COLS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'category', label: 'Category' },
  { key: 'region', label: 'Region' },
  { key: 'quantity', label: 'Qty', align: 'right' },
  { key: 'revenue', label: 'Revenue', align: 'right' },
];

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = orders.filter(
      (o) =>
        !needle ||
        o.customer.toLowerCase().includes(needle) ||
        o.product.toLowerCase().includes(needle) ||
        o.category.toLowerCase().includes(needle) ||
        o.region.toLowerCase().includes(needle) ||
        o.id.toLowerCase().includes(needle),
    );
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [orders, q, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pages - 1);
  const slice = filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir(k === 'date' || k === 'revenue' || k === 'quantity' ? 'desc' : 'asc');
    }
    setPage(0);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-slate-900">Orders</h2>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Search orders…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent-500 sm:w-64"
          aria-label="Search orders"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
              {COLS.map((c) => (
                <th key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'text-right' : ''}`}>
                  <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-slate-700">
                    {c.label}
                    {sortKey === c.key && <span aria-hidden>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{o.date}</td>
                <td className="px-4 py-2.5 text-slate-800">{o.customer}</td>
                <td className="px-4 py-2.5 text-slate-600">{o.category}</td>
                <td className="px-4 py-2.5 text-slate-600">{o.region}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{num(o.quantity)}</td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-900">{moneyExact(o.revenue)}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      o.status === 'refunded' ? 'bg-red-50 text-bad' : 'bg-green-50 text-ok'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  No orders match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 text-sm text-slate-500">
        <span>
          {filtered.length} order{filtered.length === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={clampedPage === 0}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="tabular-nums">
            {clampedPage + 1} / {pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={clampedPage >= pages - 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
