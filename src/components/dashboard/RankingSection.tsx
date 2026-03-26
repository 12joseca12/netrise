"use client";

import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface RankingItem {
  name: string;
  value: string;
}

interface RankingSectionProps {
  titleKey: string;
  items: RankingItem[];
  icon?: LucideIcon;
  valueLabelKey?: string;
}

export function RankingSection({ titleKey, items, icon: Icon, valueLabelKey }: RankingSectionProps) {
  const { t } = useLanguage();
  const displayItems = items.slice(0, 3);

  return (
    <section
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
      aria-labelledby={`ranking-${titleKey}`}
    >
      <h2 id={`ranking-${titleKey}`} className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
        {Icon && <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />}
        {t(titleKey)}
      </h2>
      {valueLabelKey && (
        <p className="sr-only">
          {t(valueLabelKey)}
        </p>
      )}
      <ul className="space-y-2" role="list">
        {displayItems.length === 0 ? (
          <li className="text-sm text-[var(--color-muted)]">{t("dashboard.ranking.noData")}</li>
        ) : (
          displayItems.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-lg bg-[var(--color-surface-alt)] px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-bold text-[var(--color-primary)]" aria-hidden>
                  {index + 1}
                </span>
                <span className="truncate text-sm font-medium text-[var(--color-text)]">{item.name || "—"}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-[var(--color-title)]">{item.value}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
