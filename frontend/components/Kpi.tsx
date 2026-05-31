import type { Kpis } from '@/lib/types';
import { money, moneyExact, num, pct } from '@/lib/format';

function Card({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-sm">{sub}</p>}
    </div>
  );
}

export default function KpiCards({ kpis }: { kpis: Kpis }) {
  const g = kpis.growthPct;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card label="Revenue" value={money(kpis.revenue)} sub={<span className="text-slate-400">in selected period</span>} />
      <Card label="Orders" value={num(kpis.orders)} sub={<span className="text-slate-400">completed + refunded</span>} />
      <Card label="Avg order value" value={moneyExact(kpis.avgOrderValue)} sub={<span className="text-slate-400">revenue ÷ orders</span>} />
      <Card
        label="Growth"
        value={g === null ? '—' : pct(g)}
        sub={
          g === null ? (
            <span className="text-slate-400">no prior period</span>
          ) : (
            <span className={g >= 0 ? 'text-ok' : 'text-bad'}>{g >= 0 ? '▲' : '▼'} vs previous period</span>
          )
        }
      />
    </div>
  );
}
