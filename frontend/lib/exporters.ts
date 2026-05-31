import type { Order, Kpis, BreakdownRow, DateRange } from './types';
import { money, moneyExact, num, pct } from './format';

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const COLUMNS: (keyof Order)[] = [
  'id',
  'date',
  'customer',
  'category',
  'region',
  'product',
  'quantity',
  'unitPrice',
  'revenue',
  'status',
];

export function exportCSV(orders: Order[], filename = 'insightboard-orders.csv') {
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = COLUMNS.join(',');
  const body = orders.map((o) => COLUMNS.map((c) => esc(o[c])).join(',')).join('\n');
  download(new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' }), filename);
}

export async function exportXLSX(orders: Order[], filename = 'insightboard-orders.xlsx') {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(orders, { header: COLUMNS as string[] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  XLSX.writeFile(wb, filename);
}

export async function exportPDF(opts: {
  kpis: Kpis;
  range: DateRange;
  categories: BreakdownRow[];
  regions: BreakdownRow[];
  orders: Order[];
  datasetLabel: string;
}) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const indigo: [number, number, number] = [79, 70, 229];

  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text('InsightBoard — Sales Report', 40, 48);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`${opts.datasetLabel}`, 40, 66);
  doc.text(`Period: ${opts.range.from} to ${opts.range.to}`, 40, 80);
  doc.text('Generated from sample data.', 40, 94);

  // KPI strip
  const k = opts.kpis;
  autoTable(doc, {
    startY: 112,
    head: [['Revenue', 'Orders', 'Avg order value', 'Growth vs prev.']],
    body: [[money(k.revenue), num(k.orders), moneyExact(k.avgOrderValue), k.growthPct === null ? '—' : pct(k.growthPct)]],
    theme: 'grid',
    headStyles: { fillColor: indigo },
    styles: { fontSize: 11, halign: 'center' },
  });

  const afterKpis = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: afterKpis + 18,
    head: [['Category', 'Revenue', 'Orders', 'Share']],
    body: opts.categories.map((r) => [r.key, money(r.revenue), num(r.orders), `${r.pct.toFixed(1)}%`]),
    theme: 'striped',
    headStyles: { fillColor: indigo },
    styles: { fontSize: 10 },
  });

  const afterCat = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: afterCat + 18,
    head: [['Region', 'Revenue', 'Orders', 'Share']],
    body: opts.regions.map((r) => [r.key, money(r.revenue), num(r.orders), `${r.pct.toFixed(1)}%`]),
    theme: 'striped',
    headStyles: { fillColor: indigo },
    styles: { fontSize: 10 },
  });

  const afterReg = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const top = [...opts.orders].sort((a, b) => b.revenue - a.revenue).slice(0, 12);
  autoTable(doc, {
    startY: afterReg + 18,
    head: [['Top orders', 'Date', 'Category', 'Region', 'Revenue']],
    body: top.map((o) => [o.id, o.date, o.category, o.region, moneyExact(o.revenue)]),
    theme: 'grid',
    headStyles: { fillColor: indigo },
    styles: { fontSize: 9 },
  });

  doc.save('insightboard-report.pdf');
}
