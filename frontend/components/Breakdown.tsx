'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BreakdownRow } from '@/lib/types';
import { money } from '@/lib/format';

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

export default function Breakdown({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="key"
              width={92}
              tick={{ fontSize: 12, fill: '#475569' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(v: number) => [money(v), 'Revenue']} contentStyle={{ fontSize: 12 }} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {rows.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {rows.map((r, i) => (
          <li key={r.key} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
              {r.key}
            </span>
            <span className="tabular-nums text-slate-500">
              {money(r.revenue)} · {r.pct.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
