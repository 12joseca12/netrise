"use client";

import { supabase } from "@/lib/supabase/client";
import type { DashboardRole } from "./types-dashboard";

const FIVE_MIN_MS = 5 * 60 * 1000;

function isConnected(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < FIVE_MIN_MS;
}

export async function getProfileRole(userId: string): Promise<DashboardRole | null> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  const role = data?.role as string | null;
  if (role === "agency" || role === "freelancer" || role === "closer") return role;
  return null;
}

export async function getAgencyMetrics(organizationId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [dealsRes, leadsRes, commissionsRes, profilesRes] = await Promise.all([
    supabase.from("deals").select("amount, closed_at, lead_id").eq("organization_id", organizationId),
    supabase.from("leads").select("id, status, created_at, assigned_to").eq("organization_id", organizationId),
    supabase.from("commissions").select("amount, status, to_user_id").eq("organization_id", organizationId),
    supabase.from("profiles").select("id, display_name, email, role, last_seen_at").eq("organization_id", organizationId).in("role", ["freelancer", "closer"]),
  ]);

  const deals = dealsRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const leadIds = leads.map((l) => l.id);
  const commissions = commissionsRes.data ?? [];
  const totalRevenue = deals.reduce((s, d) => s + Number(d.amount), 0);
  const closedLeadIds = new Set(deals.map((d) => (d as { lead_id?: string }).lead_id).filter(Boolean));

  let meetings: { lead_id: string }[] = [];
  if (leadIds.length > 0) {
    const chunk = 100;
    for (let i = 0; i < leadIds.length; i += chunk) {
      const { data } = await supabase.from("meetings").select("lead_id").in("lead_id", leadIds.slice(i, i + chunk));
      meetings = meetings.concat(data ?? []);
    }
  }
  const leadsWithMeeting = new Set(meetings.map((m) => m.lead_id));
  const conversionCount = leads.filter((l) => leadsWithMeeting.has(l.id) && closedLeadIds.has(l.id)).length;
  const meetingCount = leadsWithMeeting.size;
  const avgConversion = meetingCount > 0 ? Math.round((conversionCount / meetingCount) * 100) : 0;
  const leadsContacted = leads.filter((l) => !["generated", "pending_contact"].includes(l.status)).length;
  const leadsThisMonth = leads.filter((l) => l.created_at && l.created_at >= startOfMonth).length;
  const leadsPending = leads.filter((l) => l.status === "pending_contact" || l.status === "generated").length;
  const avgTicket = closedLeadIds.size > 0 ? Math.round(totalRevenue / closedLeadIds.size) : 0;
  const totalCommissions = commissions.reduce((s, c) => s + Number(c.amount), 0);
  const freelancersActive = new Set(profilesRes.data?.filter((p) => p.role === "freelancer").map((p) => p.id) ?? []).size;
  const closersPending = commissions.filter((c) => c.status === "pending").length;
  const roi = totalCommissions > 0 ? Math.round((totalRevenue / totalCommissions) * 100) : 0;

  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  const dealsPrev = deals.filter((d) => d.closed_at && d.closed_at >= startOfPrevMonth && d.closed_at <= endOfPrevMonth);
  const leadsPrevMonth = leads.filter((l) => l.created_at && l.created_at >= startOfPrevMonth && l.created_at <= endOfPrevMonth);
  const leadIdsPrev = leadsPrevMonth.map((l) => l.id);
  let meetingsPrev: { lead_id: string }[] = [];
  if (leadIdsPrev.length > 0) {
    const { data } = await supabase.from("meetings").select("lead_id").in("lead_id", leadIdsPrev);
    meetingsPrev = data ?? [];
  }
  const commissionsPrev = commissions.filter((c) => (c as { created_at?: string }).created_at && (c as { created_at: string }).created_at >= startOfPrevMonth && (c as { created_at: string }).created_at <= endOfPrevMonth);
  const totalRevenuePrev = dealsPrev.reduce((s, d) => s + Number(d.amount), 0);
  const closedPrev = new Set(dealsPrev.map((d) => (d as { lead_id?: string }).lead_id).filter(Boolean));
  const meetingCountPrev = new Set(meetingsPrev.map((m) => m.lead_id)).size;
  const conversionPrev = meetingCountPrev > 0 ? Math.round((dealsPrev.filter((d) => closedPrev.has((d as { lead_id?: string }).lead_id!)).length / meetingCountPrev) * 100) : 0;
  const prevMonth = {
    totalRevenue: totalRevenuePrev,
    avgConversion: conversionPrev,
    meetingCount: meetingCountPrev,
    leadsContacted: leads.filter((l) => !["generated", "pending_contact"].includes(l.status) && l.created_at && l.created_at >= startOfPrevMonth && l.created_at <= endOfPrevMonth).length,
    leadsThisMonth: leadsPrevMonth.length,
    leadsPending: 0,
    avgTicket: closedPrev.size > 0 ? Math.round(totalRevenuePrev / closedPrev.size) : 0,
    totalCommissions: commissionsPrev.reduce((s, c) => s + Number(c.amount), 0),
    freelancersActive,
    closersPending: commissionsPrev.filter((c) => c.status === "pending").length,
    roi: commissionsPrev.length ? Math.round((totalRevenuePrev / commissionsPrev.reduce((s, c) => s + Number(c.amount), 0)) * 100) : 0,
  };

  const { data: meetingsFull } = leadIds.length > 0
    ? await supabase.from("meetings").select("id, lead_id, happened_at, scheduled_at").in("lead_id", leadIds)
    : { data: [] as { id: string; lead_id: string; happened_at: string | null; scheduled_at: string | null }[] };

  return {
    totalRevenue,
    avgConversion,
    meetingCount,
    leadsContacted,
    leadsThisMonth,
    leadsPending,
    avgTicket,
    totalCommissions,
    freelancersActive,
    closersPending,
    roi,
    prevMonth,
    detail: { deals, leads, meetings: meetingsFull ?? [], commissions, profiles: profilesRes.data ?? [] },
  };
}

export async function getFreelancerMetrics(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const [leadsRes, meetingsRes, dealsRes, commissionsRes] = await Promise.all([
    supabase.from("leads").select("id, status, organization_id, created_at").eq("assigned_to", userId),
    supabase.from("meetings").select("id, scheduled_at, happened_at, lead_id"),
    supabase.from("deals").select("id, amount, closed_at").eq("closed_by", userId),
    supabase.from("commissions").select("amount, status, created_at").eq("to_user_id", userId),
  ]);

  const leads = leadsRes.data ?? [];
  const meetings = meetingsRes.data ?? [];
  const deals = dealsRes.data ?? [];
  const commissions = commissionsRes.data ?? [];
  const orgIds = [...new Set(leads.map((l) => l.organization_id))];
  const activeAgencies = orgIds.length;
  const leadsAssigned = leads.length;
  const leadsPending = leads.filter((l) => l.status === "pending_contact" || l.status === "generated").length;
  const scheduledMeetings = meetings.filter((m) => m.scheduled_at && !m.happened_at).length;
  const meetingsThisMonth = meetings.filter((m) => m.happened_at && m.happened_at >= startOfMonth).length;
  const closedSales = deals.length;
  const commissionsThisMonth = commissions
    .filter((c) => c.created_at && c.created_at >= startOfMonth)
    .reduce((s, c) => s + Number(c.amount), 0);
  const pendingCommissions = commissions.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);
  const totalDealsAmount = deals.reduce((s, d) => s + Number(d.amount), 0);
  const avgTicket = closedSales > 0 ? Math.round(totalDealsAmount / closedSales) : 0;
  const closeRatio = leads.length > 0 ? Math.round((closedSales / leads.length) * 100) : 0;

  const dealsPrev = deals.filter((d) => d.closed_at && d.closed_at >= startOfPrevMonth && d.closed_at <= endOfPrevMonth);
  const meetingsPrev = meetings.filter((m) => m.happened_at && m.happened_at >= startOfPrevMonth && m.happened_at <= endOfPrevMonth);
  const commissionsPrevMonth = commissions.filter((c) => c.created_at && c.created_at >= startOfPrevMonth && c.created_at <= endOfPrevMonth).reduce((s, c) => s + Number(c.amount), 0);
  const prevMonth = {
    activeAgencies,
    leadsAssigned: leads.filter((l) => l.created_at && l.created_at >= startOfPrevMonth && l.created_at <= endOfPrevMonth).length,
    leadsPending: 0,
    scheduledMeetings: 0,
    meetingsThisMonth: meetingsPrev.length,
    closedSales: dealsPrev.length,
    commissionsThisMonth: commissionsPrevMonth,
    pendingCommissions: 0,
    avgTicket: dealsPrev.length ? Math.round(dealsPrev.reduce((s, d) => s + Number(d.amount), 0) / dealsPrev.length) : 0,
    closeRatio: leads.length ? Math.round((dealsPrev.length / leads.length) * 100) : 0,
  };

  return {
    activeAgencies,
    leadsAssigned,
    leadsPending,
    scheduledMeetings,
    meetingsThisMonth,
    closedSales,
    commissionsThisMonth,
    pendingCommissions,
    avgTicket,
    closeRatio,
    prevMonth,
    detail: { leads, meetings, deals, commissions },
  };
}

export async function getCloserMetrics(userId: string, organizationId: string | null) {
  const agency = organizationId ? await getAgencyMetrics(organizationId) : null;
  const freelancer = await getFreelancerMetrics(userId);
  const [contactsRes] = await Promise.all([
    supabase.from("agency_contacts").select("id, organization_id, has_close").eq("contact_by", userId),
  ]);
  const contacts = contactsRes.data ?? [];
  const agenciesContacted = contacts.length;
  const agenciesWithClose = contacts.filter((c) => c.has_close).length;

  const prevMonth = {
    ...(agency?.prevMonth ?? {}),
    ...(freelancer.prevMonth ?? {}),
  };

  return {
    ...(agency ?? {}),
    agencyProjects: agency?.detail?.deals?.length ?? 0,
    agenciesContacted,
    agenciesWithClose,
    ...freelancer,
    prevMonth,
    detail: { ...agency?.detail, ...freelancer.detail, agency_contacts: contacts },
  };
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getEmptyBuckets(period: "day" | "week" | "month" | "6months" | "year"): { key: string; label: string }[] {
  const now = new Date();
  if (period === "day") {
    return Array.from({ length: 24 }, (_, i) => ({
      key: `${i}`,
      label: `${String(i).padStart(2, "0")}:00`,
    }));
  }
  if (period === "week") {
    return WEEKDAY_LABELS.map((label, i) => ({ key: String(i), label }));
  }
  if (period === "month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => ({
      key: String(i + 1),
      label: String(i + 1),
    }));
  }
  if (period === "6months") {
    const buckets: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTH_LABELS[d.getMonth()] });
    }
    return buckets;
  }
  const buckets: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTH_LABELS[d.getMonth()] });
  }
  return buckets;
}

export async function getRevenueSeries(
  organizationIdOrUserId: string,
  role: DashboardRole,
  period: "day" | "week" | "month" | "6months" | "year"
) {
  const now = new Date();
  let start = new Date(now);
  switch (period) {
    case "day":
      start.setDate(start.getDate() - 1);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "6months":
      start.setMonth(start.getMonth() - 6);
      break;
    case "year":
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  const startStr = start.toISOString();
  let query = supabase.from("deals").select("amount, closed_at").gte("closed_at", startStr);

  if (role === "agency") {
    query = query.eq("organization_id", organizationIdOrUserId);
  } else {
    query = query.eq("closed_by", organizationIdOrUserId);
  }

  const { data } = await query;
  const buckets = getEmptyBuckets(period);
  const byKey: Record<string, number> = {};
  buckets.forEach((b) => (byKey[b.key] = 0));

  for (const d of data ?? []) {
    const t = new Date(d.closed_at);
    let key: string;
    if (period === "day") {
      key = String(t.getHours());
    } else if (period === "week") {
      const day = t.getDay();
      key = String(day === 0 ? 6 : day - 1);
    } else if (period === "month") {
      key = String(t.getDate());
    } else if (period === "6months" || period === "year") {
      key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
    } else {
      key = String(t.getMonth() + 1);
    }
    if (key in byKey) byKey[key] += Number(d.amount);
  }

  return buckets.map((b) => ({ date: b.label, total: byKey[b.key] ?? 0 }));
}

export async function getClosersTable(organizationId: string) {
  const { data: leads } = await supabase.from("leads").select("id, assigned_to").eq("organization_id", organizationId);
  const leadList = leads ?? [];
  const userIds = [...new Set(leadList.map((l) => l.assigned_to).filter(Boolean))] as string[];
  if (userIds.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name, email, role, last_seen_at").in("id", userIds);
  const { data: commissions } = await supabase.from("commissions").select("to_user_id, amount, status").eq("organization_id", organizationId);
  const { data: deals } = await supabase.from("deals").select("lead_id, amount, closed_by").eq("organization_id", organizationId);
  const leadIdsByCloser = new Map<string, string[]>();
  for (const l of leadList) {
    if (!l.assigned_to) continue;
    if (!leadIdsByCloser.has(l.assigned_to)) leadIdsByCloser.set(l.assigned_to, []);
    leadIdsByCloser.get(l.assigned_to)!.push(l.id);
  }
  const closerLeadIds = Object.fromEntries(leadIdsByCloser);
  let meetingsByLead: { lead_id: string }[] = [];
  const allLeadIds = leadList.map((l) => l.id);
  if (allLeadIds.length > 0) {
    for (let i = 0; i < allLeadIds.length; i += 100) {
      const { data } = await supabase.from("meetings").select("lead_id").in("lead_id", allLeadIds.slice(i, i + 100));
      meetingsByLead = meetingsByLead.concat(data ?? []);
    }
  }
  const meetingCountByCloser = new Map<string, number>();
  for (const uid of userIds) {
    const lIds = leadIdsByCloser.get(uid) ?? [];
    const withMeeting = new Set(meetingsByLead.filter((m) => lIds.includes(m.lead_id)).map((m) => m.lead_id));
    meetingCountByCloser.set(uid, withMeeting.size);
  }
  const dealsByCloser = new Map<string, { count: number; total: number }>();
  for (const d of deals ?? []) {
    const closerId = (d as { closed_by?: string }).closed_by;
    if (!closerId) continue;
    if (!dealsByCloser.has(closerId)) dealsByCloser.set(closerId, { count: 0, total: 0 });
    const x = dealsByCloser.get(closerId)!;
    x.count += 1;
    x.total += Number((d as { amount?: unknown }).amount ?? 0);
  }
  return (profiles ?? []).map((p) => {
    const meetingsCount = meetingCountByCloser.get(p.id) ?? 0;
    const { count: salesCount, total: totalSales } = dealsByCloser.get(p.id) ?? { count: 0, total: 0 };
    const conversionRate = meetingsCount > 0 ? Math.round((salesCount / meetingsCount) * 100) : 0;
    const pending = (commissions ?? []).filter((c) => c.to_user_id === p.id && c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);
    return {
      id: p.id,
      name: (p as { display_name?: string }).display_name ?? (p as { email?: string }).email ?? "",
      status: isConnected((p as { last_seen_at?: string | null }).last_seen_at ?? null) ? "connected" : "disconnected",
      conversion_rate: conversionRate,
      total_sales_eur: totalSales,
      meetings: meetingsCount,
      pending_to_pay: pending,
    };
  });
}

export async function getFreelancersTable(organizationId: string) {
  const { data: profiles } = await supabase.from("profiles").select("id, display_name, email").eq("organization_id", organizationId).eq("role", "freelancer");
  const { data: projects } = await supabase.from("freelancer_projects").select("freelancer_id, project_name, price, percent_completed").eq("organization_id", organizationId);
  if (!profiles?.length) return [];
  const rows: { id: string; name: string; email: string; project: string; price: number; percent_completed: number }[] = [];
  if (projects.length === 0) {
    return profiles.map((p) => ({
      id: p.id,
      name: (p as { display_name?: string }).display_name ?? (p as { email?: string }).email ?? "",
      email: (p as { email?: string }).email ?? "",
      project: "—",
      price: 0,
      percent_completed: 0,
    }));
  }
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  for (const proj of projects) {
    const fid = (proj as { freelancer_id: string }).freelancer_id;
    const p = profileById.get(fid);
    if (!p) continue;
    rows.push({
      id: `${fid}-${(proj as { project_name: string }).project_name}`,
      name: (p as { display_name?: string }).display_name ?? (p as { email?: string }).email ?? "",
      email: (p as { email?: string }).email ?? "",
      project: (proj as { project_name: string }).project_name,
      price: Number((proj as { price?: unknown }).price ?? 0),
      percent_completed: Number((proj as { percent_completed?: unknown }).percent_completed ?? 0),
    });
  }
  const freelancerIdsWithProject = new Set(projects.map((pr) => (pr as { freelancer_id: string }).freelancer_id));
  for (const p of profiles) {
    if (!freelancerIdsWithProject.has(p.id)) {
      rows.push({
        id: p.id,
        name: (p as { display_name?: string }).display_name ?? (p as { email?: string }).email ?? "",
        email: (p as { email?: string }).email ?? "",
        project: "—",
        price: 0,
        percent_completed: 0,
      });
    }
  }
  return rows;
}

export async function getAgenciesTable(userId: string) {
  const { data: leads } = await supabase.from("leads").select("organization_id").eq("assigned_to", userId);
  const orgIds = [...new Set((leads ?? []).map((l) => l.organization_id).filter(Boolean))] as string[];
  if (orgIds.length === 0) return [];
  const { data } = await supabase.from("organizations").select("id, name, slug").in("id", orgIds);
  return data ?? [];
}

/** Top 3 freelancers de la agencia por valor entregado (precio × % completado) */
export async function getAgencyTopFreelancers(organizationId: string): Promise<{ name: string; value: string }[]> {
  const { data: projects } = await supabase
    .from("freelancer_projects")
    .select("freelancer_id, price, percent_completed")
    .eq("organization_id", organizationId);
  if (!projects?.length) return [];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name, email").in("id", [...new Set(projects.map((p) => (p as { freelancer_id: string }).freelancer_id))]);
  const byFreelancer = new Map<string, number>();
  for (const p of projects) {
    const fid = (p as { freelancer_id: string }).freelancer_id;
    const price = Number((p as { price?: unknown }).price ?? 0);
    const pct = Number((p as { percent_completed?: unknown }).percent_completed ?? 0);
    byFreelancer.set(fid, (byFreelancer.get(fid) ?? 0) + price * (pct / 100));
  }
  const sorted = [...byFreelancer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return sorted.map(([id, val]) => {
    const pr = (profiles ?? []).find((x) => x.id === id);
    const name = (pr as { display_name?: string })?.display_name ?? (pr as { email?: string })?.email ?? id;
    return { name, value: `€${Math.round(val).toLocaleString()}` };
  });
}

/** Top 3 closers de la agencia por ventas totales */
export async function getAgencyTopClosers(organizationId: string): Promise<{ name: string; value: string }[]> {
  const table = await getClosersTable(organizationId);
  const sorted = [...table].sort((a, b) => (b.total_sales_eur as number) - (a.total_sales_eur as number)).slice(0, 3);
  return sorted.map((r) => ({ name: r.name as string, value: `€${Number(r.total_sales_eur ?? 0).toLocaleString()}` }));
}

/** Top 3 closers para un freelancer (de las agencias con las que trabaja), por ventas */
export async function getFreelancerTopClosers(userId: string): Promise<{ name: string; value: string }[]> {
  const { data: leads } = await supabase.from("leads").select("organization_id").eq("assigned_to", userId);
  const orgIds = [...new Set((leads ?? []).map((l) => l.organization_id).filter(Boolean))] as string[];
  if (orgIds.length === 0) return [];
  const { data: orgLeads } = await supabase.from("leads").select("id, assigned_to, organization_id").in("organization_id", orgIds);
  const closerIds = [...new Set((orgLeads ?? []).map((l) => l.assigned_to).filter(Boolean))] as string[];
  if (closerIds.length === 0) return [];
  const { data: deals } = await supabase.from("deals").select("closed_by, amount").in("closed_by", closerIds);
  const byCloser = new Map<string, number>();
  for (const d of deals ?? []) {
    const id = (d as { closed_by: string }).closed_by;
    byCloser.set(id, (byCloser.get(id) ?? 0) + Number((d as { amount?: unknown }).amount ?? 0));
  }
  const { data: profiles } = await supabase.from("profiles").select("id, display_name, email").in("id", closerIds);
  const sorted = [...byCloser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return sorted.map(([id, val]) => {
    const pr = (profiles ?? []).find((x) => x.id === id);
    const name = (pr as { display_name?: string })?.display_name ?? (pr as { email?: string })?.email ?? id;
    return { name, value: `€${Math.round(val).toLocaleString()}` };
  });
}

/** Top 3 agencias para un freelancer por número de proyectos (leads asignados) */
export async function getFreelancerTopAgencies(userId: string): Promise<{ name: string; value: string }[]> {
  const { data: leads } = await supabase.from("leads").select("organization_id").eq("assigned_to", userId);
  const byOrg = new Map<string, number>();
  for (const l of leads ?? []) {
    const oid = l.organization_id;
    if (!oid) continue;
    byOrg.set(oid, (byOrg.get(oid) ?? 0) + 1);
  }
  const sorted = [...byOrg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (sorted.length === 0) return [];
  const { data: orgs } = await supabase.from("organizations").select("id, name").in("id", sorted.map(([id]) => id));
  const orgById = new Map((orgs ?? []).map((o) => [o.id, (o as { name: string }).name]));
  return sorted.map(([id, count]) => ({ name: orgById.get(id) ?? id, value: String(count) }));
}

/** Top 3 agencias para un closer (contactadas), priorizando las que tienen cierre */
export async function getCloserTopAgencies(userId: string): Promise<{ name: string; value: string }[]> {
  const { data: contacts } = await supabase.from("agency_contacts").select("organization_id, has_close").eq("contact_by", userId);
  if (!contacts?.length) return [];
  const byOrg = new Map<string, { closes: number; total: number }>();
  for (const c of contacts) {
    const oid = (c as { organization_id: string }).organization_id;
    const hasClose = (c as { has_close?: boolean }).has_close ?? false;
    if (!byOrg.has(oid)) byOrg.set(oid, { closes: 0, total: 0 });
    const x = byOrg.get(oid)!;
    x.total += 1;
    if (hasClose) x.closes += 1;
  }
  const sorted = [...byOrg.entries()].sort((a, b) => b[1].closes - a[1].closes || b[1].total - a[1].total).slice(0, 3);
  const { data: orgs } = await supabase.from("organizations").select("id, name").in("id", sorted.map(([id]) => id));
  const orgById = new Map((orgs ?? []).map((o) => [o.id, (o as { name: string }).name]));
  return sorted.map(([id, v]) => ({ name: orgById.get(id) ?? id, value: `${v.closes}/${v.total}` }));
}

/** Top 3 freelancers para un closer (de su agencia), por valor entregado */
export async function getCloserTopFreelancers(organizationId: string | null): Promise<{ name: string; value: string }[]> {
  if (!organizationId) return [];
  return getAgencyTopFreelancers(organizationId);
}
