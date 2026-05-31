// Deterministic, fictional sample sales data. Generated
// with a fixed seed so the build is stable. Customer names are well-known
// fictional placeholders (Acme, Globex, Initech…) — no real businesses.

import type { Order } from '@/lib/types';

const PRODUCTS: Record<string, [string, number][]> = {
  Apparel: [
    ['Canvas Tote', 24],
    ['Wool Beanie', 18],
    ['Linen Shirt', 48],
    ['Rain Jacket', 96],
  ],
  Home: [
    ['Stoneware Mug', 16],
    ['Linen Throw', 68],
    ['Soy Candle', 22],
    ['Ceramic Vase', 42],
  ],
  Electronics: [
    ['USB-C Hub', 39],
    ['Wireless Mouse', 29],
    ['Desk Lamp', 54],
    ['Bluetooth Speaker', 79],
  ],
  Outdoors: [
    ['Trail Bottle', 21],
    ['Camp Mug', 16],
    ['Daypack', 88],
    ['Picnic Blanket', 58],
  ],
  Beauty: [
    ['Hand Balm', 12],
    ['Bar Soap', 9],
    ['Face Mist', 26],
    ['Lip Tint', 15],
  ],
};

const CATEGORIES = Object.keys(PRODUCTS);
const REGIONS = ['North', 'South', 'East', 'West'];
const CUSTOMERS = [
  'Acme Supply Co.',
  'Globex Retail',
  'Initech Goods',
  'Umbra Mercantile',
  'Vandelay Imports',
  'Hooli Market',
  'Pied Piper Shop',
  'Stark Trading',
  'Wonka Provisions',
  'Soylent Foods',
  'Cyberdyne Outlet',
  'Wayne Bazaar',
];

// mulberry32 — tiny deterministic PRNG.
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(): Order[] {
  const r = rng(20260530);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const orders: Order[] = [];
  let n = 10000;

  // 12 months of 2025 with a gentle upward trend (more orders later in the year).
  for (let month = 0; month < 12; month++) {
    const base = 28 + month * 2; // ramps 28 → 50
    const count = base + Math.floor(r() * 10);
    const daysInMonth = new Date(2025, month + 1, 0).getDate();
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(r() * daysInMonth);
      const category = pick(CATEGORIES);
      const [product, price] = pick(PRODUCTS[category]);
      const qty = 1 + Math.floor(r() * 5);
      const status: Order['status'] = r() < 0.05 ? 'refunded' : 'completed';
      const date = `2025-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      orders.push({
        id: `ORD-${n++}`,
        date,
        customer: pick(CUSTOMERS),
        category,
        region: pick(REGIONS),
        product,
        quantity: qty,
        unitPrice: price,
        revenue: status === 'refunded' ? 0 : qty * price,
        status,
      });
    }
  }
  orders.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return orders;
}

export const seedOrders: Order[] = build();
export const seedMeta = {
  label: 'Sample dataset — Acme & friends, FY2025',
  rows: seedOrders.length,
};
