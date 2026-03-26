"use client";

import { supabase } from "@/lib/supabase/client";
import type { AgencyProfile, FreelancerProfile, CloserProfile } from "@/app/registro/completar-perfil/types";
import type { ProfileRole } from "@/app/registro/completar-perfil/types";

export type ProfileDataByRole = AgencyProfile | FreelancerProfile | CloserProfile;

export interface ProfileRow {
  id: string;
  role: ProfileRole;
  organization_id: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  profile_data: ProfileDataByRole | null;
  field_order: string[] | null;
}

const DEFAULT_FIELD_ORDER_AGENCY = [
  "photo",
  "banner",
  "bio",
  "agencyName",
  "location",
  "services",
  "niches",
  "websiteCommission",
  "citiesOperate",
  "avgTicket",
];

const DEFAULT_FIELD_ORDER_FREELANCER = [
  "photo",
  "banner",
  "bio",
  "tradeName",
  "portfolio",
  "location",
  "services",
  "niches",
  "citiesOperate",
  "avgTicket",
];

const DEFAULT_FIELD_ORDER_CLOSER = [
  "photo",
  "banner",
  "bio",
  "country",
  "languages",
  "salesExperience",
  "salesSpecialties",
  "industries",
  "avgTicketClose",
  "minCommission",
  "salesRoleType",
  "availability",
];

export function getDefaultFieldOrder(role: ProfileRole): string[] {
  if (role === "agency") return [...DEFAULT_FIELD_ORDER_AGENCY];
  if (role === "freelancer") return [...DEFAULT_FIELD_ORDER_FREELANCER];
  return [...DEFAULT_FIELD_ORDER_CLOSER];
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, organization_id, display_name, email, avatar_url, profile_data, field_order")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as ProfileRow;
}

export async function updateProfile(
  userId: string,
  updates: {
    profile_data?: ProfileDataByRole;
    field_order?: string[];
    avatar_url?: string | null;
    display_name?: string | null;
    role?: ProfileRole;
  }
): Promise<{ error: Error | null }> {
  const existing = await getProfile(userId);
  if (existing) {
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    return { error: error ?? null };
  }
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    role: updates.role ?? "agency",
    profile_data: updates.profile_data ?? null,
    field_order: updates.field_order ?? null,
    avatar_url: updates.avatar_url ?? null,
    display_name: updates.display_name ?? null,
  });
  return { error: error ?? null };
}
