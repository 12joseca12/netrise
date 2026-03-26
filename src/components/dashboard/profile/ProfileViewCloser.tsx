"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { CloserProfile } from "@/app/registro/completar-perfil/types";
import { MapPin, Info, MessageCircle, BarChart3, Video, Calendar, Target } from "lucide-react";

interface ProfileViewCloserProps {
  data: CloserProfile;
  isOwnProfile: boolean;
}

export function ProfileViewCloser({ data, isOwnProfile }: ProfileViewCloserProps) {
  const { t } = useLanguage();
  const location = data.country?.trim() || "—";
  const bio = data.bio?.trim() || "";
  const specializations = data.salesSpecialties?.length ? data.salesSpecialties : data.industries?.length ? data.industries : [];

  return (
    <div className="min-w-0">
      {/* Header: photo + name + badge + location + CTAs */}
      <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-[var(--color-surface-alt)] sm:h-48 sm:w-48">
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-[var(--color-muted)]">
              C
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[var(--color-title)] sm:text-3xl">Closer</h1>
          <p className="mt-1 flex items-center gap-1 text-[var(--color-text)]">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {location}
          </p>
          {!isOwnProfile && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                {t("profile.view.negotiate")}
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t("profile.view.message")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 metric cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Sales Volume", value: "—" },
          { label: "Rating", value: "—" },
          { label: "High-Ticket Closed", value: "—" },
          { label: "Avg. Cycle", value: "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm text-[var(--color-muted)]">{label}</p>
            <p className="mt-1 text-xl font-bold text-[var(--color-title)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,360px]">
        {/* Left: bio + specializations */}
        <div className="space-y-8">
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Info className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.professionalOverview")}
            </h2>
            <div className="prose prose-sm max-w-none text-[var(--color-text)]">
              {bio ? <p className="whitespace-pre-wrap">{bio}</p> : <p className="text-[var(--color-muted)]">{t("profile.bioPlaceholder")}</p>}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Target className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.coreSpecializations")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {specializations.length > 0 ? specializations.slice(0, 6).map((s) => (
                <div key={s} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <BarChart3 className="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
                  <span className="text-sm font-medium text-[var(--color-text)]">{s}</span>
                </div>
              )) : <p className="text-sm text-[var(--color-muted)]">—</p>}
            </div>
          </section>
        </div>

        {/* Right: video + calendar */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Video className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.introVideo")}
            </h3>
            <div className="aspect-video w-full rounded-lg bg-[var(--color-surface-alt)] flex items-center justify-center text-[var(--color-muted)] text-sm">
              —
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Calendar className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.scheduleInterview")}
            </h3>
            <p className="mb-4 text-sm text-[var(--color-muted)]">{t("profile.view.availableTimes")}</p>
            {!isOwnProfile && (
              <button type="button" className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                {t("profile.view.scheduleCall")}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
