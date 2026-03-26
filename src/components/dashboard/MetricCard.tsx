"use client";

import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  onClick: () => void;
  /** Porcentaje respecto al mes anterior: positivo = por encima, negativo = por debajo */
  percentChange?: number | null;
}

export function MetricCard({ title, value, icon: Icon, onClick, percentChange }: MetricCardProps) {
  const { t } = useLanguage();
  const hasChange = percentChange != null && !Number.isNaN(percentChange);
  const ariaLabel = hasChange
    ? `${title}: ${value} (${percentChange >= 0 ? "+" : ""}${percentChange}% ${t("dashboard.card.vsPrevMonth")})`
    : `${title}: ${value}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <span className="text-sm font-medium text-[var(--color-muted)]">{title}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--color-title)]">{value}</p>
      {hasChange && (
        <p
          className={`text-sm font-medium ${percentChange >= 0 ? "text-emerald-600" : "text-red-600"}`}
          aria-hidden
        >
          {percentChange >= 0 ? "+" : ""}{percentChange}% {t("dashboard.card.vsPrevMonth")}
        </p>
      )}
    </button>
  );
}
