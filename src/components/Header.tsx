"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useId } from "react";
import type { Locale } from "@/literals";

const NAV_LINKS = [
  { key: "nav.features" as const, href: "#features" },
  { key: "nav.pricing" as const, href: "#pricing" },
  { key: "nav.blog" as const, href: "#blog" },
  { key: "nav.about" as const, href: "#about" },
] as const;

export function Header() {
  const { t, locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const buttonId = useId();

  const themeLabel = theme === "dark" ? t("a11y.themeToLight") : t("a11y.themeToDark");
  const setLanguageLabel = (lang: Locale) =>
    t("a11y.setLanguage").replace("{lang}", lang === "es" ? "Español" : "English");

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface)]/80"
      role="banner"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 text-[var(--color-title)] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-sm"
          aria-label="Netrise - Inicio"
        >
          <Image
            src="/netriseIcon.svg"
            alt=""
            width={32}
            height={28}
            className="h-8 w-auto"
            priority
          />
          <span className="text-xl font-semibold">Netrise</span>
        </Link>

        <nav
          id={menuId}
          className="hidden items-center gap-8 md:flex"
          aria-label="Navegación principal"
        >
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="text-[var(--color-text)] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-sm hover:text-[var(--color-primary)] transition-colors text-sm font-medium"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <div className="flex rounded-lg border border-[var(--color-border)] p-0.5" role="group" aria-label={t("a11y.language")}>
            <button
              type="button"
              onClick={() => setLocale("es")}
              aria-pressed={locale === "es"}
              aria-label={setLanguageLabel("es")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                locale === "es"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text)] hover:bg-[var(--color-primary-soft)]"
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
              aria-label={setLanguageLabel("en")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                locale === "en"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text)] hover:bg-[var(--color-primary-soft)]"
              }`}
            >
              EN
            </button>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={themeLabel}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text)] hover:bg-[var(--color-primary-soft)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            {theme === "dark" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <Link
            href="/login"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--color-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 hover:bg-[var(--color-primary-soft)] transition-colors"
          >
            {t("nav.login")}
          </Link>
          <Link
            href="#get-started"
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 hover:opacity-95 transition-opacity"
          >
            {t("nav.getStarted")}
          </Link>
        </div>

        <button
          type="button"
          id={buttonId}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? t("a11y.menuClose") : t("a11y.menuOpen")}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text)] md:hidden outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div
          id={menuId}
          className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 md:hidden"
          role="dialog"
          aria-label="Menú de navegación"
        >
          <nav className="flex flex-col gap-1" aria-label="Navegación móvil">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="rounded-lg px-4 py-3 text-[var(--color-text)] no-underline font-medium hover:bg-[var(--color-primary-soft)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"
                onClick={() => setMenuOpen(false)}
              >
                {t(key)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-sm font-medium text-[var(--color-muted)]">{t("a11y.language")}</span>
                <div className="flex rounded-lg border border-[var(--color-border)] p-0.5" role="group">
                  <button
                    type="button"
                    onClick={() => { setLocale("es"); setMenuOpen(false); }}
                    aria-pressed={locale === "es"}
                    aria-label={setLanguageLabel("es")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      locale === "es" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text)]"
                    }`}
                  >
                    ES
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLocale("en"); setMenuOpen(false); }}
                    aria-pressed={locale === "en"}
                    aria-label={setLanguageLabel("en")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      locale === "en" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text)]"
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-sm font-medium text-[var(--color-muted)]">{t("theme.light")} / {t("theme.dark")}</span>
                <button
                  type="button"
                  onClick={() => { toggleTheme(); setMenuOpen(false); }}
                  aria-label={themeLabel}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text)]"
                >
                  {theme === "dark" ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
              </div>
              <Link
                href="/login"
                className="rounded-lg px-4 py-3 text-center font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.login")}
              </Link>
              <Link
                href="#get-started"
                className="rounded-lg bg-[var(--color-primary)] px-4 py-3 text-center font-medium text-white"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.getStarted")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
