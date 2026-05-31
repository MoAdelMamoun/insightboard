'use client';

import { useRef, useState } from 'react';
import type { DateRange } from '@/lib/types';

function shift(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

export default function Toolbar({
  range,
  setRange,
  bounds,
  datasetLabel,
  isUploaded,
  busy,
  onUpload,
  onReset,
  onDownloadSample,
  onExportCSV,
  onExportXLSX,
  onExportPDF,
}: {
  range: DateRange;
  setRange: (r: DateRange) => void;
  bounds: DateRange;
  datasetLabel: string;
  isUploaded: boolean;
  busy: boolean;
  onUpload: (file: File) => void;
  onReset: () => void;
  onDownloadSample: () => void;
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onExportPDF: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);

  const presets: { label: string; range: DateRange }[] = [
    { label: 'All', range: bounds },
    { label: 'Last 90 days', range: { from: shift(bounds.to, -90), to: bounds.to } },
    { label: 'Last 30 days', range: { from: shift(bounds.to, -30), to: bounds.to } },
  ];

  async function runExport(fn: () => void | Promise<void>) {
    setExporting(true);
    try {
      await fn();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Date range */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Date range</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {presets.map((p) => {
              const active = p.range.from === range.from && p.range.to === range.to;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setRange(p.range)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    active ? 'bg-accent-600 text-white' : 'border border-slate-300 text-slate-600 hover:border-accent-400'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
            <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
            <input
              type="date"
              value={range.from}
              min={bounds.from}
              max={range.to}
              onChange={(e) => setRange({ ...range, from: e.target.value })}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-accent-500"
              aria-label="From date"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={range.to}
              min={range.from}
              max={bounds.to}
              onChange={(e) => setRange({ ...range, to: e.target.value })}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-accent-500"
              aria-label="To date"
            />
          </div>
        </div>

        {/* Data source + exports */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? 'Reading…' : 'Upload CSV / Excel'}
          </button>
          <button type="button" onClick={onDownloadSample} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-accent-400">
            Sample CSV
          </button>
          <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
          <button type="button" onClick={() => runExport(onExportCSV)} disabled={exporting} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-accent-400 disabled:opacity-50">
            Export CSV
          </button>
          <button type="button" onClick={() => runExport(onExportXLSX)} disabled={exporting} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-accent-400 disabled:opacity-50">
            Excel
          </button>
          <button type="button" onClick={() => runExport(onExportPDF)} disabled={exporting} className="rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
            {exporting ? 'Exporting…' : 'PDF report'}
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5">{datasetLabel}</span>
        {isUploaded && (
          <button type="button" onClick={onReset} className="text-accent-700 underline">
            Reset to demo data
          </button>
        )}
      </div>
    </div>
  );
}
