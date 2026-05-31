export const money = (n: number): string =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const moneyExact = (n: number): string =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const num = (n: number): string => n.toLocaleString('en-US');

export const pct = (n: number): string => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

export const dateRangeBounds = (orders: { date: string }[]): { from: string; to: string } => {
  if (orders.length === 0) return { from: '2025-01-01', to: '2025-12-31' };
  let from = orders[0].date;
  let to = orders[0].date;
  for (const o of orders) {
    if (o.date < from) from = o.date;
    if (o.date > to) to = o.date;
  }
  return { from, to };
};
