import type { ProfileRole } from "./types";
import type { AgencyProfile, FreelancerProfile, CloserProfile } from "./types";

function filled(value: string | number): boolean {
  if (typeof value === "number") return true;
  return String(value).trim() !== "";
}

function tagFilled(arr: string[]): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

export function getProfileProgress(
  role: ProfileRole,
  state: AgencyProfile | FreelancerProfile | CloserProfile
): { filled: number; total: number; percent: number } {
  if (role === "agency") {
    const s = state as AgencyProfile;
    const total = 10;
    let f = 0;
    if (filled(s.photoUrl)) f++;
    if (filled(s.agencyName)) f++;
    if (filled(s.website)) f++;
    if (filled(s.country)) f++;
    if (filled(s.city)) f++;
    if (tagFilled(s.services)) f++;
    if (tagFilled(s.niches)) f++;
    if (tagFilled(s.citiesOperate)) f++;
    if (filled(s.avgTicket)) f++;
    if (s.commissionCloser > 0 || filled(String(s.commissionCloser))) f++;
    return { filled: f, total, percent: Math.round((f / total) * 100) };
  }
  if (role === "freelancer") {
    const s = state as FreelancerProfile;
    const total = 9;
    let f = 0;
    if (filled(s.photoUrl)) f++;
    if (filled(s.tradeName)) f++;
    if (filled(s.portfolio)) f++;
    if (filled(s.country)) f++;
    if (filled(s.city)) f++;
    if (tagFilled(s.services)) f++;
    if (tagFilled(s.niches)) f++;
    if (tagFilled(s.citiesOperate)) f++;
    if (filled(s.avgTicket)) f++;
    return { filled: f, total, percent: Math.round((f / total) * 100) };
  }
  const s = state as CloserProfile;
  const total = 10;
  let f = 0;
  if (filled(s.photoUrl)) f++;
  if (filled(s.country)) f++;
  if (tagFilled(s.languages)) f++;
  if (filled(s.salesExperience)) f++;
  if (tagFilled(s.salesSpecialties)) f++;
  if (tagFilled(s.industries)) f++;
  if (filled(s.avgTicketClose)) f++;
  if (filled(s.minCommission)) f++;
  if (filled(s.salesRoleType)) f++;
  if (filled(s.availability)) f++;
  return { filled: f, total, percent: Math.round((f / total) * 100) };
}
