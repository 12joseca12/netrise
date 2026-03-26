"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { User } from "lucide-react";
import { TagInput } from "@/components/TagInput";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import {
  type ProfileRole,
  type AgencyProfile,
  type FreelancerProfile,
  type CloserProfile,
  emptyAgencyProfile,
  emptyFreelancerProfile,
  emptyCloserProfile,
} from "./types";
import { getProfileProgress } from "./utils";
import { supabase } from "@/lib/supabase/client";

const STORAGE_KEY = "netrise-profile-draft";
const ROLE_KEY = "netrise-pending-role";
const NAME_KEY = "netrise-pending-name";

function loadStoredProfile(role: ProfileRole): AgencyProfile | FreelancerProfile | CloserProfile {
  if (typeof window === "undefined") {
    return role === "agency" ? emptyAgencyProfile : role === "freelancer" ? emptyFreelancerProfile : emptyCloserProfile;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return role === "agency" ? emptyAgencyProfile : role === "freelancer" ? emptyFreelancerProfile : emptyCloserProfile;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.role !== role) return role === "agency" ? emptyAgencyProfile : role === "freelancer" ? emptyFreelancerProfile : emptyCloserProfile;
    return parsed.data as AgencyProfile | FreelancerProfile | CloserProfile;
  } catch {
    return role === "agency" ? emptyAgencyProfile : role === "freelancer" ? emptyFreelancerProfile : emptyCloserProfile;
  }
}

export default function CompletarPerfilPage() {
  const { t } = useLanguage();
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [userName, setUserName] = useState("");
  const [agency, setAgency] = useState<AgencyProfile>(emptyAgencyProfile);
  const [freelancer, setFreelancer] = useState<FreelancerProfile>(emptyFreelancerProfile);
  const [closer, setCloser] = useState<CloserProfile>(emptyCloserProfile);

  useEffect(() => {
    let resolvedRole: ProfileRole = "agency";
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(ROLE_KEY);
      if (stored === "agency" || stored === "freelancer" || stored === "closer") {
        resolvedRole = stored;
      } else {
        supabase.auth.getSession().then(({ data: { session } }) => {
          const meta = session?.user?.user_metadata;
          const r = (meta?.role as string) || "agency";
          const name = (meta?.first_name as string) || "";
          setUserName(name);
          if (r === "agency" || r === "freelancer" || r === "closer") {
            setRole(r);
            const data = loadStoredProfile(r);
            if (r === "agency") setAgency(data as AgencyProfile);
            else if (r === "freelancer") setFreelancer(data as FreelancerProfile);
            else setCloser(data as CloserProfile);
          }
        });
        return;
      }
      const name = window.localStorage.getItem(NAME_KEY) || "";
      setUserName(name);
    }
    setRole(resolvedRole);
    const data = loadStoredProfile(resolvedRole);
    if (resolvedRole === "agency") setAgency(data as AgencyProfile);
    else if (resolvedRole === "freelancer") setFreelancer(data as FreelancerProfile);
    else setCloser(data as CloserProfile);
  }, []);

  const saveDraft = useCallback(() => {
    if (!role || typeof window === "undefined") return;
    const data = role === "agency" ? agency : role === "freelancer" ? freelancer : closer;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, data }));
  }, [role, agency, freelancer, closer]);

  useEffect(() => {
    saveDraft();
  }, [agency, freelancer, closer, saveDraft]);

  const progress = role ? getProfileProgress(role, role === "agency" ? agency : role === "freelancer" ? freelancer : closer) : { filled: 0, total: 10, percent: 0 };
  const headingName = userName.trim() || "there";
  const closerMinCommissionPct = Math.min(100, Math.max(0, Number(closer.minCommission) || 0));

  if (role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]" role="status" aria-live="polite">
        <p className="text-[var(--color-muted)]">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded">
            <Image src="/netriseIcon.svg" alt="Netrise" width={32} height={32} aria-hidden />
            <span className="font-semibold text-[var(--color-title)]">Netrise</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-title)] sm:text-3xl">
              {t("profile.heading").replace("{name}", headingName)}
            </h1>
            <p className="mt-1 text-[var(--color-muted)]">{t("profile.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 flex-shrink-0" role="img" aria-label={`${progress.percent}% ${t("profile.percentDone")}`}>
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
                <path
                  fill="none"
                  stroke="var(--color-surface-alt)"
                  strokeWidth="2.5"
                  d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                />
                <path
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  strokeDasharray={`${progress.percent}, 100`}
                  strokeLinecap="round"
                  d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  style={{ transition: "stroke-dasharray 0.3s ease" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[var(--color-title)]">
                {progress.percent}%
              </span>
            </div>
            <span className="text-sm text-[var(--color-muted)]">{t("profile.percentDone")}</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,280px]">
          <section aria-labelledby="form-heading" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 id="form-heading" className="sr-only">
              {t("profile.title")}
            </h2>

            {/* Foto de perfil - común a todos (drag and drop o seleccionar archivo) */}
            <PhotoDropzone
              value={role === "agency" ? agency.photoUrl : role === "freelancer" ? freelancer.photoUrl : closer.photoUrl}
              onChange={(v) => {
                if (role === "agency") setAgency((p) => ({ ...p, photoUrl: v }));
                else if (role === "freelancer") setFreelancer((p) => ({ ...p, photoUrl: v }));
                else setCloser((p) => ({ ...p, photoUrl: v }));
              }}
              label={t("profile.photo")}
              optionalLabel={t("profile.photoOptional")}
              dropText={t("profile.photoDrop")}
              selectText={t("profile.photoSelect")}
              aria-label={t("profile.photo")}
            />

            <div className="mt-6">
              <PhotoDropzone
                value={role === "agency" ? agency.bannerUrl : role === "freelancer" ? freelancer.bannerUrl : closer.bannerUrl}
                onChange={(v) => {
                  if (role === "agency") setAgency((p) => ({ ...p, bannerUrl: v }));
                  else if (role === "freelancer") setFreelancer((p) => ({ ...p, bannerUrl: v }));
                  else setCloser((p) => ({ ...p, bannerUrl: v }));
                }}
                label={t("profile.bannerPhoto")}
                optionalLabel={t("profile.bannerPhotoOptional")}
                dropText={t("profile.bannerPhotoDrop")}
                selectText={t("profile.bannerPhotoSelect")}
                aria-label={t("profile.bannerPhoto")}
              />
            </div>

            <div className="mb-6 mt-6 border-t border-[var(--color-border)] pt-6">
              <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-[var(--color-title)]">
                <User className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                {t("profile.professionalProfile")}
              </h3>
              <label htmlFor="profile-bio" className="mb-2 block text-sm font-medium text-[var(--color-title)]">
                {t("profile.professionalBio")}
              </label>
              <textarea
                id="profile-bio"
                rows={4}
                className="min-h-[8rem] w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder={t("profile.bioPlaceholder")}
                value={role === "agency" ? (agency.bio ?? "") : role === "freelancer" ? (freelancer.bio ?? "") : (closer.bio ?? "")}
                onChange={(e) => {
                  const v = e.target.value;
                  if (role === "agency") setAgency((p) => ({ ...p, bio: v }));
                  else if (role === "freelancer") setFreelancer((p) => ({ ...p, bio: v }));
                  else setCloser((p) => ({ ...p, bio: v }));
                }}
                aria-describedby="profile-bio-hint"
              />
              <p id="profile-bio-hint" className="mt-1.5 text-sm text-[var(--color-muted)]">
                {t("profile.bioSuggestion")}
              </p>
            </div>

            {role === "agency" && (
              <>
                <div className="mb-4">
                  <label htmlFor="agency-name" className="mb-2 block text-sm font-medium text-[var(--color-title)]">
                    {t("profile.agencyName")}
                  </label>
                  <input
                    id="agency-name"
                    type="text"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={agency.agencyName}
                    onChange={(e) => setAgency((p) => ({ ...p, agencyName: e.target.value }))}
                  />
                </div>
                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="agency-country" className="mb-2 block text-sm font-medium text-[var(--color-title)]">
                      {t("profile.country")}
                    </label>
                    <input
                      id="agency-country"
                      type="text"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={agency.country}
                      onChange={(e) => setAgency((p) => ({ ...p, country: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="agency-city" className="mb-2 block text-sm font-medium text-[var(--color-title)]">
                      {t("profile.city")}
                    </label>
                    <input
                      id="agency-city"
                      type="text"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={agency.city}
                      onChange={(e) => setAgency((p) => ({ ...p, city: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.services")}</label>
                    <TagInput
                      value={agency.services}
                      onChange={(services) => setAgency((p) => ({ ...p, services }))}
                      placeholder={t("profile.servicesTag")}
                      aria-label={t("profile.services")}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.niches")}</label>
                    <TagInput
                      value={agency.niches}
                      onChange={(niches) => setAgency((p) => ({ ...p, niches }))}
                      placeholder={t("profile.nichesTag")}
                      aria-label={t("profile.niches")}
                    />
                  </div>
                </div>
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="agency-website" className="mb-2 block text-sm font-medium text-[var(--color-title)]">
                      {t("profile.website")}
                    </label>
                    <input
                      id="agency-website"
                      type="url"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={agency.website}
                      onChange={(e) => setAgency((p) => ({ ...p, website: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="agency-commission" className="mb-2 block text-sm font-medium text-[var(--color-title)]">
                      {t("profile.commissionCloser")} ({agency.commissionCloser}%)
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        id="agency-commission"
                        type="range"
                        min={0}
                        max={100}
                        value={agency.commissionCloser}
                        onChange={(e) => setAgency((p) => ({ ...p, commissionCloser: Number(e.target.value) }))}
                        className="range-primary flex-1"
                        style={{ "--range-percent": `${agency.commissionCloser}%` } as React.CSSProperties}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={agency.commissionCloser}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={agency.commissionCloser}
                        onChange={(e) => setAgency((p) => ({ ...p, commissionCloser: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                        className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-center text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        aria-label={t("profile.commissionCloser")}
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.citiesOperate")}</label>
                  <TagInput
                    value={agency.citiesOperate}
                    onChange={(citiesOperate) => setAgency((p) => ({ ...p, citiesOperate }))}
                    placeholder={t("profile.citiesOperateTag")}
                    aria-label={t("profile.citiesOperate")}
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="agency-avg-ticket" className="mb-2 block text-sm font-medium text-[var(--color-title)]">
                    {t("profile.avgTicket")}
                  </label>
                  <input
                    id="agency-avg-ticket"
                    type="text"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={agency.avgTicket}
                    onChange={(e) => setAgency((p) => ({ ...p, avgTicket: e.target.value }))}
                  />
                </div>
              </>
            )}

            {role === "freelancer" && (
              <>
                <div className="mb-4">
                  <label htmlFor="fl-trade-name" className="mb-2 block text-sm font-medium text-[var(--color-title)]">
                    {t("profile.tradeName")} <span className="text-[var(--color-muted)]">({t("profile.tradeNameOptional")})</span>
                  </label>
                  <input
                    id="fl-trade-name"
                    type="text"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={freelancer.tradeName}
                    onChange={(e) => setFreelancer((p) => ({ ...p, tradeName: e.target.value }))}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="fl-portfolio" className="mb-2 block text-sm font-medium text-[var(--color-title)]">
                    {t("profile.portfolio")}
                  </label>
                  <input
                    id="fl-portfolio"
                    type="url"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={freelancer.portfolio}
                    onChange={(e) => setFreelancer((p) => ({ ...p, portfolio: e.target.value }))}
                  />
                </div>
                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fl-country" className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.country")}</label>
                    <input
                      id="fl-country"
                      type="text"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={freelancer.country}
                      onChange={(e) => setFreelancer((p) => ({ ...p, country: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="fl-city" className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.city")}</label>
                    <input
                      id="fl-city"
                      type="text"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={freelancer.city}
                      onChange={(e) => setFreelancer((p) => ({ ...p, city: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.services")}</label>
                    <TagInput value={freelancer.services} onChange={(services) => setFreelancer((p) => ({ ...p, services }))} placeholder={t("profile.servicesTag")} aria-label={t("profile.services")} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.niches")}</label>
                    <TagInput value={freelancer.niches} onChange={(niches) => setFreelancer((p) => ({ ...p, niches }))} placeholder={t("profile.nichesTag")} aria-label={t("profile.niches")} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.citiesOperate")}</label>
                  <TagInput value={freelancer.citiesOperate} onChange={(citiesOperate) => setFreelancer((p) => ({ ...p, citiesOperate }))} placeholder={t("profile.citiesOperateTag")} aria-label={t("profile.citiesOperate")} />
                </div>
                <div className="mb-6">
                  <label htmlFor="fl-avg-ticket" className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.avgTicket")}</label>
                  <input
                    id="fl-avg-ticket"
                    type="text"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={freelancer.avgTicket}
                    onChange={(e) => setFreelancer((p) => ({ ...p, avgTicket: e.target.value }))}
                  />
                </div>
              </>
            )}

            {role === "closer" && (
              <>
                <div className="mb-4">
                  <label htmlFor="cl-country" className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.country")}</label>
                  <input
                    id="cl-country"
                    type="text"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={closer.country}
                    onChange={(e) => setCloser((p) => ({ ...p, country: e.target.value }))}
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.languages")}</label>
                  <TagInput value={closer.languages} onChange={(languages) => setCloser((p) => ({ ...p, languages }))} placeholder={t("profile.languagesTag")} aria-label={t("profile.languages")} />
                </div>
                <div className="mb-4">
                  <label htmlFor="cl-sales-exp" className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.salesExperience")}</label>
                  <input
                    id="cl-sales-exp"
                    type="text"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={closer.salesExperience}
                    onChange={(e) => setCloser((p) => ({ ...p, salesExperience: e.target.value }))}
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.salesSpecialties")}</label>
                  <TagInput value={closer.salesSpecialties} onChange={(salesSpecialties) => setCloser((p) => ({ ...p, salesSpecialties }))} placeholder={t("profile.salesSpecialtiesTag")} aria-label={t("profile.salesSpecialties")} />
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.industries")}</label>
                  <TagInput value={closer.industries} onChange={(industries) => setCloser((p) => ({ ...p, industries }))} placeholder={t("profile.industriesTag")} aria-label={t("profile.industries")} />
                </div>
                <div className="mb-4">
                  <label htmlFor="cl-avg-ticket" className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.avgTicketClose")}</label>
                  <input
                    id="cl-avg-ticket"
                    type="text"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={closer.avgTicketClose}
                    onChange={(e) => setCloser((p) => ({ ...p, avgTicketClose: e.target.value }))}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="cl-min-commission" className="mb-2 block text-sm font-medium text-[var(--color-title)]">
                    {t("profile.minCommission")} ({closerMinCommissionPct}%)
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      id="cl-min-commission"
                      type="range"
                      min={0}
                      max={100}
                      value={closerMinCommissionPct}
                      onChange={(e) => setCloser((p) => ({ ...p, minCommission: e.target.value }))}
                      className="range-primary flex-1"
                      style={{ "--range-percent": `${closerMinCommissionPct}%` } as React.CSSProperties}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={closerMinCommissionPct}
                      aria-label={t("profile.minCommission")}
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={closerMinCommissionPct}
                      onChange={(e) => setCloser((p) => ({ ...p, minCommission: String(Math.min(100, Math.max(0, Number(e.target.value) || 0))) }))}
                      className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-center text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      aria-label={t("profile.minCommission")}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="cl-role-type" className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.salesRoleType")}</label>
                  <input
                    id="cl-role-type"
                    type="text"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={closer.salesRoleType}
                    onChange={(e) => setCloser((p) => ({ ...p, salesRoleType: e.target.value }))}
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="cl-availability" className="mb-2 block text-sm font-medium text-[var(--color-title)]">{t("profile.availability")}</label>
                  <input
                    id="cl-availability"
                    type="text"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    value={closer.availability}
                    onChange={(e) => setCloser((p) => ({ ...p, availability: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-6">
              <button
                type="button"
                onClick={() => {
                  saveDraft();
                  window.location.href = "/";
                }}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {t("profile.saveLater")}
              </button>
              <button
                type="button"
                onClick={() => {
                  saveDraft();
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem(ROLE_KEY);
                    window.localStorage.removeItem(NAME_KEY);
                    window.localStorage.removeItem(STORAGE_KEY);
                  }
                  window.location.href = "/";
                }}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              >
                {t("profile.completeProfile")}
              </button>
            </div>
          </section>

          <aside className="lg:block" aria-label={t("profile.whyComplete")}>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <h3 className="font-semibold text-[var(--color-title)]">{t("profile.whyComplete")}</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
                <li>{t("profile.whyComplete1")}</li>
                <li>{t("profile.whyComplete2")}</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
