"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardSidebar } from "./DashboardSidebar";

const SIDEBAR_COLLAPSED_KEY = "netrise-dashboard-sidebar-collapsed";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(SIDEBAR_COLLAPSED_KEY) : null;
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== "undefined") localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-white focus:outline-none"
      >
        {t("a11y.skipToContent")}
      </a>
      <DashboardSidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <main
        className={`min-h-screen pt-14 transition-[margin-left] duration-200 md:pt-0 ${collapsed ? "md:pl-[4.5rem]" : "md:pl-64"}`}
        id="dashboard-main"
        role="main"
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
