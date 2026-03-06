"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useId } from "react";

const FAQ_ITEMS = [
  { q: "section.faq.q1" as const, a: "section.faq.a1" as const },
  { q: "section.faq.q2" as const, a: "section.faq.a2" as const },
  { q: "section.faq.q3" as const, a: "section.faq.a3" as const },
  { q: "section.faq.q4" as const, a: "section.faq.a4" as const },
];

const SECTION_WHY_CARDS = [
  { title: "section.why.card1.title", desc: "section.why.card1.desc" },
  { title: "section.why.card2.title", desc: "section.why.card2.desc" },
  { title: "section.why.card3.title", desc: "section.why.card3.desc" },
] as const;

const SECTION_HOW_CARDS = [
  { title: "section.how.card1.title", desc: "section.how.card1.desc" },
  { title: "section.how.card2.title", desc: "section.how.card2.desc" },
  { title: "section.how.card3.title", desc: "section.how.card3.desc" },
] as const;

const SECTION_FREELANCERS_CARDS = [
  { title: "section.freelancers.card1.title", desc: "section.freelancers.card1.desc" },
  { title: "section.freelancers.card2.title", desc: "section.freelancers.card2.desc" },
  { title: "section.freelancers.card3.title", desc: "section.freelancers.card3.desc" },
] as const;

const SECTION_EVERYTHING_CARDS = [
  { title: "section.everything.card1.title", desc: "section.everything.card1.desc" },
  { title: "section.everything.card2.title", desc: "section.everything.card2.desc" },
  { title: "section.everything.card3.title", desc: "section.everything.card3.desc" },
] as const;

function SectionHeading({
  tagKey,
  titleKey,
  subtitleKey,
  t,
}: {
  tagKey?: string;
  titleKey?: string;
  subtitleKey?: string;
  t: (k: string) => string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {tagKey != null && (
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-primary)]">
          {t(tagKey)}
        </p>
      )}
      {titleKey != null && (
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-title)] sm:text-4xl">
          {t(titleKey)}
        </h2>
      )}
      {subtitleKey != null && (
        <p className="mt-4 text-lg text-[var(--color-muted)]">
          {t(subtitleKey)}
        </p>
      )}
    </div>
  );
}

function Card({
  title,
  description,
  icon,
  className = "",
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {icon != null && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          aria-hidden
        >
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-[var(--color-title)]">{title}</h3>
      <p className="mt-3 text-[var(--color-muted)]">{description}</p>
    </article>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqHeadingId = useId();

  const heroTitle = t("hero.title");
  const highlight = t("hero.titleHighlight");
  const heroTitleParts = heroTitle.split(highlight);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-white focus:outline-none"
      >
        {t("a11y.skipToContent")}
      </a>
      <Header />
      <main id="main" className="min-h-screen" role="main">
        {/* Hero */}
        <section
          className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="hero-heading"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
              <div>
                <h1
                  id="hero-heading"
                  className="text-4xl font-bold tracking-tight text-[var(--color-title)] sm:text-5xl lg:text-6xl"
                >
                  {heroTitleParts[0]}
                  <span className="text-[var(--color-primary)]">{highlight}</span>
                  {heroTitleParts[1]}
                </h1>
                <p className="mt-6 max-w-xl text-lg text-[var(--color-muted)]">
                  {t("hero.subtitle")}
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <a
                    href="#get-started"
                    className="inline-flex min-h-[3rem] min-w-[8rem] items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 py-3 text-base font-semibold text-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 hover:opacity-95 transition-opacity"
                  >
                    {t("hero.ctaPrimary")}
                  </a>
                  <a
                    href="#demo"
                    className="inline-flex min-h-[3rem] min-w-[8rem] items-center justify-center rounded-xl border-2 border-[var(--color-primary)] bg-transparent px-6 py-3 text-base font-semibold text-[var(--color-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 hover:bg-[var(--color-primary-soft)] transition-colors"
                  >
                    {t("hero.ctaSecondary")}
                  </a>
                </div>
                <p className="mt-8 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <span className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-alt)]"
                        aria-hidden
                      />
                    ))}
                  </span>
                  {t("hero.trustedBy")}
                </p>
              </div>
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-lg">
                  <div className="aspect-video rounded-lg bg-[var(--color-surface-alt)] flex items-center justify-center text-[var(--color-muted)]">
                    <span className="text-sm">Dashboard preview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Agencies Need Us */}
        <section
          id="features"
          className="scroll-mt-20 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="why-heading"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              tagKey="section.why.tag"
              titleKey="section.why.title"
              subtitleKey="section.why.subtitle"
              t={t}
            />
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {SECTION_WHY_CARDS.map(({ title, desc }) => (
                <Card
                  key={title}
                  title={t(title)}
                  description={t(desc)}
                  icon={
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* How Closers Win */}
        <section
          className="border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              tagKey="section.how.tag"
              titleKey="section.how.title"
              subtitleKey="section.how.subtitle"
              t={t}
            />
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {SECTION_HOW_CARDS.map(({ title, desc }) => (
                <Card
                  key={title}
                  title={t(title)}
                  description={t(desc)}
                  icon={
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* Freelancers */}
        <section
          className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="freelancers-heading"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              tagKey="section.freelancers.tag"
              titleKey="section.freelancers.title"
              subtitleKey="section.freelancers.subtitle"
              t={t}
            />
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {SECTION_FREELANCERS_CARDS.map(({ title, desc }) => (
                <Card
                  key={title}
                  title={t(title)}
                  description={t(desc)}
                  icon={
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* Everything you need */}
        <section
          className="border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="everything-heading"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              titleKey="section.everything.title"
              subtitleKey="section.everything.subtitle"
              t={t}
            />
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {SECTION_EVERYTHING_CARDS.map(({ title, desc }) => (
                <Card
                  key={title}
                  title={t(title)}
                  description={t(desc)}
                  icon={
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM14 18a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM6 18a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                    </svg>
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="scroll-mt-20 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="pricing-heading"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              titleKey="section.pricing.title"
              subtitleKey="section.pricing.subtitle"
              t={t}
            />
            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {/* Starter */}
              <article className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
                <p className="text-sm font-medium text-[var(--color-muted)]">{t("section.pricing.starter.label")}</p>
                <h3 className="mt-2 text-2xl font-bold text-[var(--color-title)]">{t("section.pricing.starter.name")}</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[var(--color-title)]">$49</span>
                  <span className="text-[var(--color-muted)]">/mes</span>
                </p>
                <p className="mt-4 text-[var(--color-muted)]">{t("section.pricing.starter.desc")}</p>
                <ul className="mt-6 flex-1 space-y-3" role="list">
                  {[t("section.pricing.feature.projects"), t("section.pricing.feature.portal"), t("section.pricing.feature.support")].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <span className="text-[var(--color-primary)]" aria-hidden>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="#get-started"
                  className="mt-8 inline-flex min-h-[3rem] items-center justify-center rounded-xl border-2 border-[var(--color-primary)] bg-transparent font-semibold text-[var(--color-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 hover:bg-[var(--color-primary-soft)]"
                >
                  {t("section.pricing.starter.cta")}
                </a>
              </article>

              {/* Pro - destacado */}
              <article className="relative flex flex-col rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-surface)] p-8 shadow-lg ring-2 ring-[var(--color-primary-soft)]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white">
                  {t("section.pricing.pro.badge")}
                </div>
                <p className="text-sm font-medium text-[var(--color-muted)]">{t("section.pricing.pro.label")}</p>
                <h3 className="mt-2 text-2xl font-bold text-[var(--color-title)]">{t("section.pricing.pro.name")}</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[var(--color-title)]">$99</span>
                  <span className="text-[var(--color-muted)]">/mes</span>
                </p>
                <p className="mt-4 text-[var(--color-muted)]">{t("section.pricing.pro.desc")}</p>
                <ul className="mt-6 flex-1 space-y-3" role="list">
                  {[t("section.pricing.feature.projects"), t("section.pricing.feature.portal"), t("section.pricing.feature.billing"), t("section.pricing.feature.priority")].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <span className="text-[var(--color-primary)]" aria-hidden>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="#get-started"
                  className="mt-8 inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[var(--color-primary)] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 hover:opacity-95"
                >
                  {t("section.pricing.pro.cta")}
                </a>
              </article>

              {/* Enterprise */}
              <article className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
                <p className="text-sm font-medium text-[var(--color-muted)]">{t("section.pricing.enterprise.label")}</p>
                <h3 className="mt-2 text-2xl font-bold text-[var(--color-title)]">{t("section.pricing.enterprise.name")}</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[var(--color-title)]">$249</span>
                  <span className="text-[var(--color-muted)]">/mes</span>
                </p>
                <p className="mt-4 text-[var(--color-muted)]">{t("section.pricing.enterprise.desc")}</p>
                <ul className="mt-6 flex-1 space-y-3" role="list">
                  {[t("section.pricing.feature.projects"), t("section.pricing.feature.portal"), t("section.pricing.feature.billing"), t("section.pricing.feature.priority"), t("section.pricing.feature.custom")].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <span className="text-[var(--color-primary)]" aria-hidden>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className="mt-8 inline-flex min-h-[3rem] items-center justify-center rounded-xl border-2 border-[var(--color-primary)] bg-transparent font-semibold text-[var(--color-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 hover:bg-[var(--color-primary-soft)]"
                >
                  {t("section.pricing.enterprise.cta")}
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby={faqHeadingId}
        >
          <div className="mx-auto max-w-3xl">
            <h2 id={faqHeadingId} className="text-center text-3xl font-bold text-[var(--color-title)] sm:text-4xl">
              {t("section.faq.title")}
            </h2>
            <div className="mt-12 space-y-2">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaq === index;
                const id = `faq-${index}`;
                const answerId = `faq-answer-${index}`;
                return (
                  <div
                    key={id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden"
                  >
                    <h3>
                      <button
                        type="button"
                        id={id}
                        aria-expanded={isOpen}
                        aria-controls={answerId}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-[var(--color-title)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                      >
                        {t(item.q)}
                        <span
                          className={`shrink-0 text-[var(--color-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                          aria-hidden
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </span>
                      </button>
                    </h3>
                    <div
                      id={answerId}
                      role="region"
                      aria-labelledby={id}
                      hidden={!isOpen}
                      className="border-t border-[var(--color-border)]"
                    >
                      <p className="px-5 py-4 text-[var(--color-muted)]">{t(item.a)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="bg-[var(--color-primary)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="cta-heading"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="cta-heading" className="text-3xl font-bold text-white sm:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="mt-4 text-lg text-white/90">{t("cta.subtitle")}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#get-started"
                className="inline-flex min-h-[3rem] min-w-[10rem] items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-[var(--color-primary)] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary)] hover:bg-white/95"
              >
                {t("cta.primary")}
              </a>
              <a
                href="#demo"
                className="inline-flex min-h-[3rem] min-w-[10rem] items-center justify-center rounded-xl border-2 border-white bg-transparent px-6 py-3 font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary)] hover:bg-white/10"
              >
                {t("cta.secondary")}
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
