"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { User, Pencil, GripVertical, Settings } from "lucide-react";
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
} from "@/app/registro/completar-perfil/types";
import {
  getProfile,
  updateProfile,
  getDefaultFieldOrder,
  type ProfileRow,
  type ProfileDataByRole,
} from "./profile-data";
import { supabase } from "@/lib/supabase/client";
import { ProfileViewAgency } from "@/components/dashboard/profile/ProfileViewAgency";
import { ProfileViewFreelancer } from "@/components/dashboard/profile/ProfileViewFreelancer";
import { ProfileViewCloser } from "@/components/dashboard/profile/ProfileViewCloser";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";
const labelClass = "mb-2 block text-sm font-medium text-[var(--color-title)]";

export function ProfileContent() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldOrder, setFieldOrder] = useState<string[]>([]);
  const [form, setForm] = useState<ProfileDataByRole>(emptyAgencyProfile);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const role = (profile?.role ?? "agency") as ProfileRole;

  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    const p = await getProfile(uid);
    const fallbackRole = (session?.user?.user_metadata?.role as ProfileRole) ?? "agency";
    setProfile(p ?? { id: uid, role: fallbackRole, organization_id: null, display_name: null, email: null, avatar_url: null, profile_data: null, field_order: null });
    const roleToUse = (p?.role as ProfileRole) ?? fallbackRole;
    const order = (p?.field_order as string[] | null) ?? getDefaultFieldOrder(roleToUse);
    setFieldOrder(order);
    const empty = roleToUse === "agency" ? emptyAgencyProfile : roleToUse === "freelancer" ? emptyFreelancerProfile : emptyCloserProfile;
    const data = (p?.profile_data as ProfileDataByRole | null) ?? empty;
    setForm({ ...empty, ...data } as ProfileDataByRole);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const payload: ProfileDataByRole = role === "agency"
      ? { ...form, photoUrl: (form as AgencyProfile).photoUrl || profile.avatar_url || "" }
      : role === "freelancer"
        ? { ...form, photoUrl: (form as FreelancerProfile).photoUrl || profile.avatar_url || "" }
        : { ...form, photoUrl: (form as CloserProfile).photoUrl || profile.avatar_url || "" };
    await updateProfile(profile.id, { profile_data: payload, field_order: fieldOrder });
    setProfile((prev) => (prev ? { ...prev, profile_data: payload, field_order: fieldOrder } : null));
    setIsEditing(false);
    setSaving(false);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };
  const handleDragLeave = () => setDragOverId(null);
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;
    const idx = fieldOrder.indexOf(sourceId);
    const targetIdx = fieldOrder.indexOf(targetId);
    if (idx === -1 || targetIdx === -1) return;
    const next = [...fieldOrder];
    next.splice(idx, 1);
    next.splice(targetIdx, 0, sourceId);
    setFieldOrder(next);
  };

  const SectionWrapper = ({
    id,
    children,
    className = "",
  }: { id: string; children: React.ReactNode; className?: string }) => {
    const isDragOver = dragOverId === id;
    if (!isEditing) return <div className={className}>{children}</div>;
    return (
      <div
        className={`group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 ${isDragOver ? "ring-2 ring-[var(--color-primary)]" : ""} ${className}`}
        draggable
        onDragStart={(e) => handleDragStart(e, id)}
        onDragOver={(e) => handleDragOver(e, id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, id)}
      >
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <span className="cursor-grab touch-none text-[var(--color-muted)]" title="Arrastrar para reordenar" aria-hidden>
            <GripVertical className="h-4 w-4" />
          </span>
          <span className="text-[var(--color-primary)]" aria-hidden>
            <Pencil className="h-4 w-4" />
          </span>
        </div>
        {children}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-[var(--color-muted)]">Cargando perfil…</p>
      </div>
    );
  }

  const orderedIds = fieldOrder.filter((id) => {
    if (role === "agency") return ["photo", "banner", "bio", "agencyName", "location", "services", "niches", "websiteCommission", "citiesOperate", "avgTicket"].includes(id);
    if (role === "freelancer") return ["photo", "banner", "bio", "tradeName", "portfolio", "location", "services", "niches", "citiesOperate", "avgTicket"].includes(id);
    return ["photo", "banner", "bio", "country", "languages", "salesExperience", "salesSpecialties", "industries", "avgTicketClose", "minCommission", "salesRoleType", "availability"].includes(id);
  });
  const defaultOrder = getDefaultFieldOrder(role);
  const missing = defaultOrder.filter((id) => !orderedIds.includes(id));
  const ordered = [...orderedIds, ...missing];

  const agency = form as AgencyProfile;
  const freelancer = form as FreelancerProfile;
  const closer = form as CloserProfile;
  const setAgency = (fn: (p: AgencyProfile) => AgencyProfile) => setForm(fn(agency));
  const setFreelancer = (fn: (p: FreelancerProfile) => FreelancerProfile) => setForm(fn(freelancer));
  const setCloser = (fn: (p: CloserProfile) => CloserProfile) => setForm(fn(closer));
  const closerMinPct = Math.min(100, Math.max(0, Number(closer.minCommission) || 0));

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "photo": {
        const photoUrl = agency.photoUrl ?? freelancer.photoUrl ?? closer.photoUrl ?? "";
        return (
          <SectionWrapper id="photo" className="mb-4">
            {isEditing ? (
              <PhotoDropzone
                value={photoUrl}
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
            ) : (
              <div>
                <p className={labelClass}>{t("profile.photo")}</p>
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="h-32 w-32 rounded-full object-cover" />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[var(--color-surface-alt)] text-[var(--color-muted)] text-sm">{t("profile.photoOptional")}</div>
                )}
              </div>
            )}
          </SectionWrapper>
        );
      }
      case "banner": {
        const bannerUrl = agency.bannerUrl ?? freelancer.bannerUrl ?? closer.bannerUrl ?? "";
        return (
          <SectionWrapper id="banner" className="mb-4">
            {isEditing ? (
              <PhotoDropzone
                value={bannerUrl}
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
            ) : (
              <div>
                <p className={labelClass}>{t("profile.bannerPhoto")}</p>
                {bannerUrl ? (
                  <img src={bannerUrl} alt="" className="h-32 w-full rounded-lg object-cover" />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center rounded-lg bg-[var(--color-surface-alt)] text-sm text-[var(--color-muted)]">{t("profile.bannerPhotoOptional")}</div>
                )}
              </div>
            )}
          </SectionWrapper>
        );
      }
      case "bio":
        return (
          <SectionWrapper id="bio" className="mb-4">
            <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-[var(--color-title)]">
              <User className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              {t("profile.professionalProfile")}
            </h3>
            <label htmlFor="profile-bio" className={labelClass}>{t("profile.professionalBio")}</label>
            <textarea
              id="profile-bio"
              rows={4}
              className="min-h-[8rem] w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder={t("profile.bioPlaceholder")}
              value={agency.bio ?? freelancer.bio ?? closer.bio ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (role === "agency") setAgency((p) => ({ ...p, bio: v }));
                else if (role === "freelancer") setFreelancer((p) => ({ ...p, bio: v }));
                else setCloser((p) => ({ ...p, bio: v }));
              }}
              readOnly={!isEditing}
            />
            <p className="mt-1.5 text-sm text-[var(--color-muted)]">{t("profile.bioSuggestion")}</p>
          </SectionWrapper>
        );
      case "agencyName":
        return (
          <SectionWrapper id="agencyName" className="mb-4">
            <label htmlFor="agency-name" className={labelClass}>{t("profile.agencyName")}</label>
            <input
              id="agency-name"
              type="text"
              className={inputClass}
              placeholder={t("profile.agencyName")}
              value={agency.agencyName ?? ""}
              onChange={(e) => setAgency((p) => ({ ...p, agencyName: e.target.value }))}
              readOnly={!isEditing}
            />
          </SectionWrapper>
        );
      case "location":
        return role === "agency" ? (
          <SectionWrapper id="location" className="mb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="agency-country" className={labelClass}>{t("profile.country")}</label>
                <input id="agency-country" type="text" className={inputClass} placeholder={t("profile.country")} value={agency.country ?? ""} onChange={(e) => setAgency((p) => ({ ...p, country: e.target.value }))} readOnly={!isEditing} />
              </div>
              <div>
                <label htmlFor="agency-city" className={labelClass}>{t("profile.city")}</label>
                <input id="agency-city" type="text" className={inputClass} placeholder={t("profile.city")} value={agency.city ?? ""} onChange={(e) => setAgency((p) => ({ ...p, city: e.target.value }))} readOnly={!isEditing} />
              </div>
            </div>
          </SectionWrapper>
        ) : (
          <SectionWrapper id="location" className="mb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fl-country" className={labelClass}>{t("profile.country")}</label>
                <input id="fl-country" type="text" className={inputClass} placeholder={t("profile.country")} value={freelancer.country ?? ""} onChange={(e) => setFreelancer((p) => ({ ...p, country: e.target.value }))} readOnly={!isEditing} />
              </div>
              <div>
                <label htmlFor="fl-city" className={labelClass}>{t("profile.city")}</label>
                <input id="fl-city" type="text" className={inputClass} placeholder={t("profile.city")} value={freelancer.city ?? ""} onChange={(e) => setFreelancer((p) => ({ ...p, city: e.target.value }))} readOnly={!isEditing} />
              </div>
            </div>
          </SectionWrapper>
        );
      case "services": {
        const services = role === "agency" ? agency.services : freelancer.services;
        return (
          <SectionWrapper id="services" className="mb-4">
            <label className={labelClass}>{t("profile.services")}</label>
            {isEditing ? (
              <TagInput value={services} onChange={(v) => (role === "agency" ? setAgency((p) => ({ ...p, services: v })) : setFreelancer((p) => ({ ...p, services: v })))} placeholder={t("profile.servicesTag")} aria-label={t("profile.services")} />
            ) : (
              <p className="text-[var(--color-text)]">{services?.length ? services.join(", ") : t("profile.servicesTag")}</p>
            )}
          </SectionWrapper>
        );
      }
      case "niches": {
        const niches = role === "agency" ? agency.niches : freelancer.niches;
        return (
          <SectionWrapper id="niches" className="mb-4">
            <label className={labelClass}>{t("profile.niches")}</label>
            {isEditing ? (
              <TagInput value={niches} onChange={(v) => (role === "agency" ? setAgency((p) => ({ ...p, niches: v })) : setFreelancer((p) => ({ ...p, niches: v })))} placeholder={t("profile.nichesTag")} aria-label={t("profile.niches")} />
            ) : (
              <p className="text-[var(--color-text)]">{niches?.length ? niches.join(", ") : t("profile.nichesTag")}</p>
            )}
          </SectionWrapper>
        );
      }
      case "websiteCommission":
        return (
          <SectionWrapper id="websiteCommission" className="mb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="agency-website" className={labelClass}>{t("profile.website")}</label>
                <input id="agency-website" type="url" className={inputClass} placeholder={t("profile.website")} value={agency.website ?? ""} onChange={(e) => setAgency((p) => ({ ...p, website: e.target.value }))} readOnly={!isEditing} />
              </div>
              <div>
                <label className={labelClass}>{t("profile.commissionCloser")} ({agency.commissionCloser ?? 0}%)</label>
                <div className="flex gap-3 items-center">
                  <input type="range" min={0} max={100} value={agency.commissionCloser ?? 0} onChange={(e) => setAgency((p) => ({ ...p, commissionCloser: Number(e.target.value) }))} className="range-primary flex-1" style={{ "--range-percent": `${agency.commissionCloser ?? 0}%` } as React.CSSProperties} readOnly={!isEditing} disabled={!isEditing} />
                  <input type="number" min={0} max={100} value={agency.commissionCloser ?? 0} onChange={(e) => setAgency((p) => ({ ...p, commissionCloser: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))} className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-center text-sm text-[var(--color-text)]" readOnly={!isEditing} disabled={!isEditing} />
                </div>
              </div>
            </div>
          </SectionWrapper>
        );
      case "citiesOperate": {
        const cities = role === "agency" ? agency.citiesOperate : freelancer.citiesOperate;
        return (
          <SectionWrapper id="citiesOperate" className="mb-4">
            <label className={labelClass}>{t("profile.citiesOperate")}</label>
            {isEditing ? (
              <TagInput value={cities} onChange={(v) => (role === "agency" ? setAgency((p) => ({ ...p, citiesOperate: v })) : setFreelancer((p) => ({ ...p, citiesOperate: v })))} placeholder={t("profile.citiesOperateTag")} aria-label={t("profile.citiesOperate")} />
            ) : (
              <p className="text-[var(--color-text)]">{cities?.length ? cities.join(", ") : t("profile.citiesOperateTag")}</p>
            )}
          </SectionWrapper>
        );
      }
      case "avgTicket":
        return (
          <SectionWrapper id="avgTicket" className="mb-4">
            <label htmlFor="agency-avg-ticket" className={labelClass}>{t("profile.avgTicket")}</label>
            <input id="agency-avg-ticket" type="text" inputMode="decimal" className={inputClass} placeholder={t("profile.avgTicket")} value={role === "agency" ? (agency.avgTicket ?? "") : (freelancer.avgTicket ?? "")} onChange={(e) => (role === "agency" ? setAgency((p) => ({ ...p, avgTicket: e.target.value })) : setFreelancer((p) => ({ ...p, avgTicket: e.target.value })))} readOnly={!isEditing} />
          </SectionWrapper>
        );
      case "tradeName":
        return (
          <SectionWrapper id="tradeName" className="mb-4">
            <label htmlFor="fl-trade-name" className={labelClass}>{t("profile.tradeName")} <span className="text-[var(--color-muted)]">({t("profile.tradeNameOptional")})</span></label>
            <input id="fl-trade-name" type="text" className={inputClass} placeholder={t("profile.tradeName")} value={freelancer.tradeName ?? ""} onChange={(e) => setFreelancer((p) => ({ ...p, tradeName: e.target.value }))} readOnly={!isEditing} />
          </SectionWrapper>
        );
      case "portfolio":
        return (
          <SectionWrapper id="portfolio" className="mb-4">
            <label htmlFor="fl-portfolio" className={labelClass}>{t("profile.portfolio")}</label>
            <input id="fl-portfolio" type="url" className={inputClass} placeholder={t("profile.portfolio")} value={freelancer.portfolio ?? ""} onChange={(e) => setFreelancer((p) => ({ ...p, portfolio: e.target.value }))} readOnly={!isEditing} />
          </SectionWrapper>
        );
      case "country":
        return (
          <SectionWrapper id="country" className="mb-4">
            <label htmlFor="cl-country" className={labelClass}>{t("profile.country")}</label>
            <input id="cl-country" type="text" className={inputClass} placeholder={t("profile.country")} value={closer.country ?? ""} onChange={(e) => setCloser((p) => ({ ...p, country: e.target.value }))} readOnly={!isEditing} />
          </SectionWrapper>
        );
      case "languages":
        return (
          <SectionWrapper id="languages" className="mb-4">
            <label className={labelClass}>{t("profile.languages")}</label>
            {isEditing ? (
              <TagInput value={closer.languages} onChange={(l) => setCloser((p) => ({ ...p, languages: l }))} placeholder={t("profile.languagesTag")} aria-label={t("profile.languages")} />
            ) : (
              <p className="text-[var(--color-text)]">{closer.languages?.length ? closer.languages.join(", ") : t("profile.languagesTag")}</p>
            )}
          </SectionWrapper>
        );
      case "salesExperience":
        return (
          <SectionWrapper id="salesExperience" className="mb-4">
            <label htmlFor="cl-sales-exp" className={labelClass}>{t("profile.salesExperience")}</label>
            <input id="cl-sales-exp" type="text" className={inputClass} placeholder={t("profile.salesExperience")} value={closer.salesExperience ?? ""} onChange={(e) => setCloser((p) => ({ ...p, salesExperience: e.target.value }))} readOnly={!isEditing} />
          </SectionWrapper>
        );
      case "salesSpecialties":
        return (
          <SectionWrapper id="salesSpecialties" className="mb-4">
            <label className={labelClass}>{t("profile.salesSpecialties")}</label>
            {isEditing ? (
              <TagInput value={closer.salesSpecialties} onChange={(v) => setCloser((p) => ({ ...p, salesSpecialties: v }))} placeholder={t("profile.salesSpecialtiesTag")} aria-label={t("profile.salesSpecialties")} />
            ) : (
              <p className="text-[var(--color-text)]">{closer.salesSpecialties?.length ? closer.salesSpecialties.join(", ") : t("profile.salesSpecialtiesTag")}</p>
            )}
          </SectionWrapper>
        );
      case "industries":
        return (
          <SectionWrapper id="industries" className="mb-4">
            <label className={labelClass}>{t("profile.industries")}</label>
            {isEditing ? (
              <TagInput value={closer.industries} onChange={(v) => setCloser((p) => ({ ...p, industries: v }))} placeholder={t("profile.industriesTag")} aria-label={t("profile.industries")} />
            ) : (
              <p className="text-[var(--color-text)]">{closer.industries?.length ? closer.industries.join(", ") : t("profile.industriesTag")}</p>
            )}
          </SectionWrapper>
        );
      case "avgTicketClose":
        return (
          <SectionWrapper id="avgTicketClose" className="mb-4">
            <label htmlFor="cl-avg-ticket" className={labelClass}>{t("profile.avgTicketClose")}</label>
            <input id="cl-avg-ticket" type="text" inputMode="decimal" className={inputClass} placeholder={t("profile.avgTicketClose")} value={closer.avgTicketClose ?? ""} onChange={(e) => setCloser((p) => ({ ...p, avgTicketClose: e.target.value }))} readOnly={!isEditing} />
          </SectionWrapper>
        );
      case "minCommission":
        return (
          <SectionWrapper id="minCommission" className="mb-4">
            <label className={labelClass}>{t("profile.minCommission")} ({closerMinPct}%)</label>
            <div className="flex gap-3 items-center">
              <input type="range" min={0} max={100} value={closerMinPct} onChange={(e) => setCloser((p) => ({ ...p, minCommission: e.target.value }))} className="range-primary flex-1" style={{ "--range-percent": `${closerMinPct}%` } as React.CSSProperties} readOnly={!isEditing} disabled={!isEditing} />
              <input type="number" min={0} max={100} value={closerMinPct} onChange={(e) => setCloser((p) => ({ ...p, minCommission: String(Math.min(100, Math.max(0, Number(e.target.value) || 0))) }))} className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-center text-sm text-[var(--color-text)]" readOnly={!isEditing} disabled={!isEditing} />
            </div>
          </SectionWrapper>
        );
      case "salesRoleType":
        return (
          <SectionWrapper id="salesRoleType" className="mb-4">
            <label htmlFor="cl-role-type" className={labelClass}>{t("profile.salesRoleType")}</label>
            <input id="cl-role-type" type="text" className={inputClass} placeholder={t("profile.salesRoleType")} value={closer.salesRoleType ?? ""} onChange={(e) => setCloser((p) => ({ ...p, salesRoleType: e.target.value }))} readOnly={!isEditing} />
          </SectionWrapper>
        );
      case "availability":
        return (
          <SectionWrapper id="availability" className="mb-4">
            <label htmlFor="cl-availability" className={labelClass}>{t("profile.availability")}</label>
            <input id="cl-availability" type="text" className={inputClass} placeholder={t("profile.availability")} value={closer.availability ?? ""} onChange={(e) => setCloser((p) => ({ ...p, availability: e.target.value }))} readOnly={!isEditing} />
          </SectionWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-title)] sm:text-3xl">{t("dashboard.nav.perfil")}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            aria-label={t("profile.settings")}
          >
            <Settings className="h-4 w-4" aria-hidden />
            {t("profile.settings")}
          </button>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              aria-label={t("profile.edit")}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {t("profile.edit")}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                {t("profile.cancel")}
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-70">
                {saving ? "…" : t("profile.save")}
              </button>
            </>
          )}
        </div>
      </div>

      {!isEditing ? (
        <div aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="sr-only">{t("profile.professionalProfile")}</h2>
          {role === "agency" && <ProfileViewAgency data={agency} isOwnProfile />}
          {role === "freelancer" && <ProfileViewFreelancer data={freelancer} isOwnProfile />}
          {role === "closer" && <ProfileViewCloser data={closer} isOwnProfile />}
        </div>
      ) : (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm" aria-labelledby="profile-heading-edit">
          <h2 id="profile-heading-edit" className="sr-only">{t("profile.edit")}</h2>
          {ordered.map((id) => (
            <Fragment key={id}>{renderSection(id)}</Fragment>
          ))}
        </section>
      )}
    </div>
  );
}
