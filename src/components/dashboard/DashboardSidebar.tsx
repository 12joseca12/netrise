"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Compass,
  MessageSquare,
  Rss,
  Bell,
  Users,
  Briefcase,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";

type NavRole = "agency" | "freelancer" | "closer";

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function DashboardSidebar({ collapsed, onToggleCollapsed }: DashboardSidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [role, setRole] = useState<NavRole | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const r = (session?.user?.user_metadata?.role as string) || "";
      if (r === "agency" || r === "freelancer" || r === "closer") setRole(r);
      else {
        const pending = typeof window !== "undefined" ? localStorage.getItem("netrise-pending-role") : null;
        if (pending === "agency" || pending === "freelancer" || pending === "closer") setRole(pending);
        else setRole("agency");
      }
    });
  }, []);

  const baseNav = [
    { href: "/dashboard", labelKey: "dashboard.nav.dashboard", Icon: LayoutDashboard },
    { href: "/dashboard/perfil", labelKey: "dashboard.nav.perfil", Icon: User },
    { href: "/dashboard/explora", labelKey: "dashboard.nav.explora", Icon: Compass },
    { href: "/dashboard/mensajes", labelKey: "dashboard.nav.mensajes", Icon: MessageSquare },
    { href: "/dashboard/feed", labelKey: "dashboard.nav.feed", Icon: Rss },
    { href: "/dashboard/notificaciones", labelKey: "dashboard.nav.notificaciones", Icon: Bell },
  ];

  const roleNav =
    role === "agency"
      ? { href: "/dashboard/equipo", labelKey: "dashboard.nav.equipo", Icon: Users }
      : role === "freelancer" || role === "closer"
        ? { href: "/dashboard/trabajos", labelKey: "dashboard.nav.trabajos", Icon: Briefcase }
        : null;

  const navItems = roleNav ? [...baseNav, roleNav] : baseNav;

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
        : "text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]"
    }`;

  const showLabels = !collapsed;

  const sidebarContent = (
    <>
      <div className="flex h-16 flex-shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] px-3">
        <Link
          href="/dashboard"
          className="flex min-w-0 flex-1 items-center justify-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] md:justify-start md:flex-initial"
        >
          <Image
            src="/netriseIcon.svg"
            alt=""
            width={32}
            height={32}
            className={`flex-shrink-0 ${collapsed ? "h-6 w-6 md:h-7 w-7" : "h-8 w-8"}`}
            aria-hidden
          />
          {showLabels && <span className="truncate font-semibold text-[var(--color-title)]">Netrise</span>}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4" aria-label="Navegación principal">
        {navItems.map(({ href, labelKey, Icon }) => (
          <Link
            key={href}
            href={href}
            className={linkClass(href)}
            aria-current={pathname === href ? "page" : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0" aria-hidden />
            {showLabels && <span className="truncate">{t(labelKey)}</span>}
          </Link>
        ))}
      </nav>
      <div className="border-t border-[var(--color-border)] p-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] md:justify-center"
          aria-label={collapsed ? t("dashboard.nav.expand") : t("dashboard.nav.collapse")}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" aria-hidden /> : <PanelLeftClose className="h-5 w-5" aria-hidden />}
          {showLabels && <span>{collapsed ? t("dashboard.nav.expand") : t("dashboard.nav.collapse")}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2 shadow-sm md:hidden"
        role="banner"
      >
        <Link
          href="/dashboard"
          className="flex shrink-0 rounded p-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          aria-label="Netrise"
        >
          <Image src="/netriseIcon.svg" alt="" width={28} height={28} className="h-7 w-7" aria-hidden />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto py-1" aria-label="Navegación rápida">
          {navItems.map(({ href, labelKey, Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 rounded-lg p-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  isActive ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : "text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
                }`}
                aria-label={t(labelKey)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </Link>
            );
          })}
        </nav>
      </header>

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg transition-[width] duration-200
          md:flex
          ${collapsed ? "md:w-[4.5rem]" : "md:w-64"}
        `}
        aria-label="Menú lateral"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
