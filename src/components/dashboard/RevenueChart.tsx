"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type RevenuePeriod = "day" | "week" | "month" | "6months" | "year";

interface RevenueChartProps {
  data: { date: string; total: number }[];
  period: RevenuePeriod;
  onPeriodChange: (p: RevenuePeriod) => void;
}

const PERIODS: { value: RevenuePeriod; key: string }[] = [
  { value: "day", key: "dashboard.chart.day" },
  { value: "week", key: "dashboard.chart.week" },
  { value: "month", key: "dashboard.chart.month" },
  { value: "6months", key: "dashboard.chart.sixMonths" },
  { value: "year", key: "dashboard.chart.year" },
];

export function RevenueChart({ data, period, onPeriodChange }: RevenueChartProps) {
  const { t } = useLanguage();

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm md:p-6" aria-labelledby="revenue-chart-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="revenue-chart-title" className="text-lg font-semibold text-[var(--color-title)]">
          {t("dashboard.chart.title")}
        </h2>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Período">
          {PERIODS.map(({ value, key }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={period === value}
              onClick={() => onPeriodChange(value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                period === value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" stroke="var(--color-muted)" fontSize={12} tickLine={false} />
            <YAxis stroke="var(--color-muted)" fontSize={12} tickLine={false} tickFormatter={(v) => `€${Number(v).toLocaleString()}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "var(--color-title)" }}
              formatter={(value: number) => [`€${Number(value).toLocaleString()}`, ""]}
            />
            <Area type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} fill="url(#revenueGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
