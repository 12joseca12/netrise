"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

const FOOTER_LINKS = {
  product: [
    { key: "footer.features" as const, href: "#features" },
    { key: "nav.pricing" as const, href: "#pricing" },
    { key: "footer.roadmap" as const, href: "#roadmap" },
    { key: "footer.integrations" as const, href: "#integrations" },
  ],
  company: [
    { key: "footer.about" as const, href: "#about" },
    { key: "nav.blog" as const, href: "#blog" },
    { key: "footer.careers" as const, href: "#careers" },
    { key: "footer.contact" as const, href: "#contact" },
  ],
  legal: [
    { key: "footer.privacy" as const, href: "#privacy" },
    { key: "footer.terms" as const, href: "#terms" },
    { key: "footer.cookies" as const, href: "#cookies" },
  ],
} as const;

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const copyright = t("footer.copyright").replace("{year}", String(year));

  return (
    <footer
      className="border-t border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)]"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="mb-4 flex items-center gap-3 text-[var(--color-title)] no-underline"
              aria-label="Netrise - Inicio"
            >
              <Image
                src="/netriseIcon.svg"
                alt=""
                width={32}
                height={28}
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold">Netrise</span>
            </Link>
            <p className="max-w-xs text-sm text-[var(--color-muted)]">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {t("footer.product")}
            </h3>
            <ul className="space-y-3" role="list">
              {FOOTER_LINKS.product.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--color-text)] no-underline hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-sm outline-none"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {t("footer.company")}
            </h3>
            <ul className="space-y-3" role="list">
              {FOOTER_LINKS.company.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--color-text)] no-underline hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-sm outline-none"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-3" role="list">
              {FOOTER_LINKS.legal.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--color-text)] no-underline hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-sm outline-none"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-8 sm:flex-row">
          <p className="text-sm text-[var(--color-muted)]">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
