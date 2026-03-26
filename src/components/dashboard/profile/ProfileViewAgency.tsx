"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { AgencyProfile } from "@/app/registro/completar-perfil/types";
import { MapPin, Globe, Info, Briefcase, MessageCircle, Calendar, Users } from "lucide-react";

interface ProfileViewAgencyProps {
  data: AgencyProfile;
  isOwnProfile: boolean;
}

export function ProfileViewAgency({ data, isOwnProfile }: ProfileViewAgencyProps) {
  const { t } = useLanguage();
  const name = data.agencyName?.trim() || "—";
  const location = [data.city, data.country].filter(Boolean).join(", ") || "—";
  const bio = data.bio?.trim() || "";

  const bannerUrl = data.bannerUrl?.trim() || "";

  return (
    <div className="min-w-0">
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-surface-alt)]" style={{ height: "320px" }}>
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-[var(--color-surface-alt)]/50" aria-hidden />
        <div className="absolute left-6 bottom-6 flex items-end gap-4 sm:left-12 sm:bottom-8">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-lg bg-[var(--color-surface)] sm:h-32 sm:w-32">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[var(--color-muted)]">
                {(data.agencyName || "A")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-[var(--color-title)] sm:text-3xl">{name || t("profile.agencyName")}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[var(--color-text)]">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {location}
              </span>
              {data.website && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4 shrink-0" aria-hidden />
                  {data.website}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: t("profile.view.projectsCompleted"), value: "—" },
          { label: t("profile.view.revenueGenerated"), value: "—" },
          { label: t("profile.view.clientRetention"), value: "—" },
          { label: t("profile.view.activeClosers"), value: "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-sm text-[var(--color-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-title)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        {/* Left column */}
        <div className="space-y-8">
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Info className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.aboutUs")}
            </h2>
            <div className="prose prose-sm max-w-none text-[var(--color-text)]">
              {bio ? <p className="whitespace-pre-wrap">{bio}</p> : <p className="text-[var(--color-muted)]">{t("profile.bioPlaceholder")}</p>}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
                <Briefcase className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                {t("profile.view.webPortfolio")}
              </h2>
              <span className="text-sm font-medium text-[var(--color-primary)]">{t("profile.view.viewAll")}</span>
            </div>
            <p className="text-sm text-[var(--color-muted)]">{t("profile.portfolio")}: {data.website || "—"}</p>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Briefcase className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.activeJobs")}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">—</p>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <MessageCircle className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.clientTestimonials")}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">—</p>
          </section>
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-[var(--color-title)]">{t("profile.view.readyToScale")}</h3>
            <p className="mb-4 text-sm text-[var(--color-text)]">
              Reserva una llamada con nuestro equipo para ver si encajamos en tu proyecto.
            </p>
            {!isOwnProfile && (
              <div className="flex flex-col gap-3">
                <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                  <Calendar className="h-5 w-5" aria-hidden />
                  {t("profile.view.bookCall")}
                </button>
                <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  {t("profile.view.messageAgency")}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Users className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.ourTopClosers")}
            </h3>
            <p className="mb-3 text-sm text-[var(--color-muted)]">—</p>
            <span className="text-sm font-medium text-[var(--color-primary)]">{t("profile.view.viewAllClosers")}</span>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <MapPin className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.location")}
            </h3>
            <p className="text-sm text-[var(--color-text)]">{location}</p>
            {data.citiesOperate?.length > 0 && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">{data.citiesOperate.join(", ")}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
