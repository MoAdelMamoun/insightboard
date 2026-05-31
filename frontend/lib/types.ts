export type Category = 'Apparel' | 'Home' | 'Electronics' | 'Outdoors' | 'Beauty';
export type Region = 'North' | 'South' | 'East' | 'West';

export interface Order {
  id: string;
  date: string; // ISO date, "YYYY-MM-DD"
  customer: string;
  category: string;
  region: string;
  product: string;
  quantity: number;
  unitPrice: number;
  revenue: number;
  status: 'completed' | 'refunded';
}

export interface Kpis {
  revenue: number;
  orders: number;
  avgOrderValue: number;
  growthPct: number | null; // vs the previous equal-length period; null if N/A
}

export interface SeriesPoint {
  label: string; // "Jan 2025"
  revenue: number;
  orders: number;
}

export interface BreakdownRow {
  key: string;
  revenue: number;
  orders: number;
  pct: number;
}

export interface DateRange {
  from: string; // ISO date inclusive
  to: string; // ISO date inclusive
}
