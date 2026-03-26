"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { FreelancerProfile } from "@/app/registro/completar-perfil/types";
import { MapPin, Info, Briefcase, MessageCircle, BarChart3, Handshake } from "lucide-react";

interface ProfileViewFreelancerProps {
  data: FreelancerProfile;
  isOwnProfile: boolean;
}

export function ProfileViewFreelancer({ data, isOwnProfile }: ProfileViewFreelancerProps) {
  const { t } = useLanguage();
  const name = data.tradeName?.trim() || "—";
  const location = [data.city, data.country].filter(Boolean).join(", ") || "—";
  const tags = [...(data.services || []), ...(data.niches || [])].filter(Boolean);
  const bio = data.bio?.trim() || "";

  return (
    <div className="min-w-0">
      {/* Header block: photo + name + location + CTAs */}
      <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-[var(--color-surface-alt)] sm:h-48 sm:w-48">
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-[var(--color-muted)]">
              {(data.tradeName || "F")[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[var(--color-title)] sm:text-3xl">{name}</h1>
          <p className="mt-1 text-[var(--color-text)]">{location}</p>
          {!isOwnProfile && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t("profile.view.message")}
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                {t("profile.view.hireMe")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
        {/* Left sidebar */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Briefcase className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.coreExpertise")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.length > 0 ? tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-sm text-[var(--color-text)]">
                  {tag}
                </span>
              )) : <span className="text-sm text-[var(--color-muted)]">—</span>}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.trackRecord")}
            </h2>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
              <div className="h-full w-2/3 rounded-full bg-[var(--color-primary)]" style={{ width: "66%" }} aria-hidden />
            </div>
            <div className="mt-3 flex justify-between text-sm text-[var(--color-muted)]">
              <span>{t("profile.view.totalJobs")}: —</span>
              <span>{t("profile.view.hoursWorked")}: —</span>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Handshake className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.agencyPartner")}
            </h2>
            <p className="mb-4 text-sm text-[var(--color-text)]">
              Colaboración con agencias para proyectos de alto impacto.
            </p>
            {!isOwnProfile && (
              <button type="button" className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                {t("profile.view.collaborationInquiry")}
              </button>
            )}
          </section>
        </aside>

        {/* Main */}
        <div className="space-y-8">
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Info className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.aboutMe")}
            </h2>
            <div className="prose prose-sm max-w-none text-[var(--color-text)]">
              {bio ? <p className="whitespace-pre-wrap">{bio}</p> : <p className="text-[var(--color-muted)]">{t("profile.bioPlaceholder")}</p>}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              <Briefcase className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.view.portfolio")}
            </h2>
            <p className="text-sm text-[var(--color-text)]">{data.portfolio || "—"}</p>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-title)]">
              {t("profile.view.servicePackages")}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">—</p>
          </section>
        </div>
      </div>
    </div>
  );
}
