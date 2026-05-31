import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'InsightBoard — Business Analytics Dashboard',
  description:
    'Ingest a CSV/Excel file and get KPI cards, a revenue time-series, category/region breakdowns, a filterable table and PDF/Excel/CSV export. A static showcase project by Mohamed Adel Mamoun.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-dash items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-600 text-sm font-bold text-white">IB</span>
              <span className="text-lg font-semibold text-slate-900">InsightBoard</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Showcase project</span>
            </div>
            <a
              href="https://github.com/MoAdelMamoun/insightboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 hover:text-accent-700"
            >
              Source ↗
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-dash px-4 py-6">{children}</main>

        <footer className="mt-10 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-dash px-4 py-6 text-sm text-slate-500">
            InsightBoard runs on bundled sample data — by{' '}
            <a href="https://mohamedadelmamoun.com" target="_blank" rel="noopener noreferrer" className="text-accent-700 underline">
              Mohamed Adel Mamoun
            </a>
            . Proves: Dashboards + PDF/Excel automation.
          </div>
        </footer>
      </body>
    </html>
  );
}
