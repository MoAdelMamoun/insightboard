import type { Order, Kpis, SeriesPoint, BreakdownRow, DateRange } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function inRange(orders: Order[], range: DateRange): Order[] {
  return orders.filter((o) => o.date >= range.from && o.date <= range.to);
}

function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

function shiftDate(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

export function computeKpis(all: Order[], range: DateRange): Kpis {
  const current = inRange(all, range);
  const revenue = current.reduce((s, o) => s + o.revenue, 0);
  const orders = current.length;
  const avgOrderValue = orders ? revenue / orders : 0;

  // Previous equal-length window immediately before `from`.
  const span = dayDiff(range.from, range.to);
  const prevTo = shiftDate(range.from, -1);
  const prevFrom = shiftDate(prevTo, -span);
  const prevRevenue = inRange(all, { from: prevFrom, to: prevTo }).reduce((s, o) => s + o.revenue, 0);
  const growthPct = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : null;

  return { revenue, orders, avgOrderValue, growthPct };
}

/** Monthly revenue/orders series across the range (good for a 1-year window). */
export function monthlySeries(all: Order[], range: DateRange): SeriesPoint[] {
  const current = inRange(all, range);
  const map = new Map<string, SeriesPoint>();
  for (const o of current) {
    const d = new Date(o.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const p = map.get(key) ?? { label, revenue: 0, orders: 0 };
    p.revenue += o.revenue;
    p.orders += 1;
    map.set(key, p);
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, v]) => v);
}

export function breakdown(all: Order[], range: DateRange, by: 'category' | 'region'): BreakdownRow[] {
  const current = inRange(all, range);
  const total = current.reduce((s, o) => s + o.revenue, 0) || 1;
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const o of current) {
    const key = String(o[by]);
    const v = map.get(key) ?? { revenue: 0, orders: 0 };
    v.revenue += o.revenue;
    v.orders += 1;
    map.set(key, v);
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, revenue: v.revenue, orders: v.orders, pct: (v.revenue / total) * 100 }))
    .sort((a, b) => b.revenue - a.revenue);
}
