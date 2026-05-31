import type { Order } from './types';

// Flexible header matching so real-world CSV/Excel files "just work".
const ALIASES: Record<keyof Omit<Order, 'revenue' | 'id'> | 'revenue' | 'id', string[]> = {
  id: ['id', 'order id', 'order_id', 'order'],
  date: ['date', 'order date', 'order_date', 'created', 'created_at'],
  customer: ['customer', 'client', 'customer name', 'account'],
  category: ['category', 'cat', 'product category'],
  region: ['region', 'area', 'territory', 'zone'],
  product: ['product', 'item', 'sku', 'product name'],
  quantity: ['quantity', 'qty', 'units', 'count'],
  unitPrice: ['unitprice', 'unit price', 'unit_price', 'price', 'rate'],
  revenue: ['revenue', 'total', 'amount', 'sales', 'line_total', 'line total'],
  status: ['status', 'state'],
};

function norm(k: string): string {
  return k.toLowerCase().trim().replace(/\s+/g, ' ');
}

function findKey(row: Record<string, unknown>, aliases: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const a of aliases) {
    const hit = keys.find((k) => norm(k) === a);
    if (hit) return hit;
  }
  return undefined;
}

function toISO(v: unknown): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === 'number' && v > 20000 && v < 60000) {
    // Excel serial date → JS date
    const ms = Math.round((v - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

const numOf = (v: unknown): number => {
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
};

export interface ParseResult {
  orders: Order[];
  total: number;
  skipped: number;
  warnings: string[];
}

export async function parseFile(file: File): Promise<ParseResult> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  if (rows.length === 0) return { orders: [], total: 0, skipped: 0, warnings: ['The file had no rows.'] };

  const sample = rows[0];
  const key = (k: keyof typeof ALIASES) => findKey(sample, ALIASES[k]);
  const kDate = key('date');
  const kRev = key('revenue');
  const kQty = key('quantity');
  const kPrice = key('unitPrice');

  const warnings: string[] = [];
  if (!kDate) warnings.push('No recognizable "date" column — rows without a valid date are skipped.');
  if (!kRev && !(kQty && kPrice)) warnings.push('No "revenue" column and no quantity×price — revenue may read as 0.');

  const orders: Order[] = [];
  let skipped = 0;
  let auto = 1;

  for (const row of rows) {
    const date = kDate ? toISO(row[kDate]) : null;
    if (!date) {
      skipped++;
      continue;
    }
    const quantity = kQty ? numOf(row[kQty]) || 1 : 1;
    const unitPrice = kPrice ? numOf(row[kPrice]) : 0;
    const status = (key('status') ? String(row[key('status')!]).toLowerCase() : 'completed').includes('refund')
      ? 'refunded'
      : 'completed';
    const revenue = kRev ? numOf(row[kRev]) : status === 'refunded' ? 0 : quantity * unitPrice;
    const idKey = key('id');
    orders.push({
      id: idKey && row[idKey] ? String(row[idKey]) : `ROW-${auto++}`,
      date,
      customer: key('customer') ? String(row[key('customer')!]) || '—' : '—',
      category: key('category') ? String(row[key('category')!]) || 'Uncategorized' : 'Uncategorized',
      region: key('region') ? String(row[key('region')!]) || 'Unknown' : 'Unknown',
      product: key('product') ? String(row[key('product')!]) || '—' : '—',
      quantity,
      unitPrice,
      revenue,
      status,
    });
  }

  if (orders.length === 0) warnings.push('No rows could be read — check that the first sheet has a header row.');
  return { orders, total: rows.length, skipped, warnings };
}
