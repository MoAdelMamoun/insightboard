'use client';

import { useMemo, useState } from 'react';
import type { DateRange, Order } from '@/lib/types';
import { seedOrders, seedMeta } from '@/data/seed';
import { computeKpis, monthlySeries, breakdown, inRange } from '@/lib/analytics';
import { dateRangeBounds } from '@/lib/format';
import { parseFile } from '@/lib/parse';
import { exportCSV, exportXLSX, exportPDF } from '@/lib/exporters';
import Toolbar from './Toolbar';
import KpiCards from './Kpi';
import RevenueChart from './RevenueChart';
import Breakdown from './Breakdown';
import OrdersTable from './OrdersTable';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [datasetLabel, setDatasetLabel] = useState<string>(`${seedMeta.label} · ${seedMeta.rows} rows`);
  const [isUploaded, setIsUploaded] = useState(false);
  const [bounds, setBounds] = useState<DateRange>(dateRangeBounds(seedOrders));
  const [range, setRange] = useState<DateRange>(dateRangeBounds(seedOrders));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'info' | 'warn'; text: string } | null>(null);

  const scoped = useMemo(() => inRange(orders, range), [orders, range]);
  const kpis = useMemo(() => computeKpis(orders, range), [orders, range]);
  const series = useMemo(() => monthlySeries(orders, range), [orders, range]);
  const catRows = useMemo(() => breakdown(orders, range, 'category'), [orders, range]);
  const regRows = useMemo(() => breakdown(orders, range, 'region'), [orders, range]);

  async function onUpload(file: File) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await parseFile(file);
      if (res.orders.length === 0) {
        setNotice({ kind: 'warn', text: `Couldn’t read any rows from “${file.name}”. ${res.warnings.join(' ')}` });
        return;
      }
      const b = dateRangeBounds(res.orders);
      setOrders(res.orders);
      setBounds(b);
      setRange(b);
      setIsUploaded(true);
      setDatasetLabel(`Uploaded: ${file.name} · ${res.orders.length} rows`);
      const extra = res.skipped ? ` ${res.skipped} row(s) skipped.` : '';
      setNotice({
        kind: res.warnings.length ? 'warn' : 'info',
        text: `Loaded ${res.orders.length} of ${res.total} rows from “${file.name}”.${extra} ${res.warnings.join(' ')}`.trim(),
      });
    } catch (err) {
      setNotice({ kind: 'warn', text: `Failed to parse the file: ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  function onReset() {
    setOrders(seedOrders);
    const b = dateRangeBounds(seedOrders);
    setBounds(b);
    setRange(b);
    setIsUploaded(false);
    setDatasetLabel(`${seedMeta.label} · ${seedMeta.rows} rows`);
    setNotice(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Sales analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Drop in a CSV or Excel export and explore KPIs, trends and breakdowns — then export a report. Starts on bundled
          sample data so it works with zero setup.
        </p>
      </div>

      <Toolbar
        range={range}
        setRange={setRange}
        bounds={bounds}
        datasetLabel={datasetLabel}
        isUploaded={isUploaded}
        busy={busy}
        onUpload={onUpload}
        onReset={onReset}
        onDownloadSample={() => exportCSV(seedOrders, 'insightboard-sample.csv')}
        onExportCSV={() => exportCSV(scoped)}
        onExportXLSX={() => exportXLSX(scoped)}
        onExportPDF={() =>
          exportPDF({ kpis, range, categories: catRows, regions: regRows, orders: scoped, datasetLabel })
        }
      />

      {notice && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.kind === 'warn'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-accent-100 bg-accent-50 text-accent-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      <KpiCards kpis={kpis} />

      <RevenueChart data={series} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Breakdown title="Revenue by category" rows={catRows} />
        <Breakdown title="Revenue by region" rows={regRows} />
      </div>

      <OrdersTable orders={scoped} />
    </div>
  );
}
