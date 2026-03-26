"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Percent,
  Calendar,
  Users,
  Target,
  Clock,
  TrendingUp,
  Wallet,
  Briefcase,
  AlertCircle,
  BarChart3,
  Handshake,
  FileCheck,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DetailModal } from "@/components/dashboard/DetailModal";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DataTableExport } from "@/components/dashboard/DataTableExport";
import { RankingSection } from "@/components/dashboard/RankingSection";
import type { DashboardRole } from "./types-dashboard";
import type { RevenuePeriod } from "@/components/dashboard/RevenueChart";
import {
  getProfileRole,
  getAgencyMetrics,
  getFreelancerMetrics,
  getCloserMetrics,
  getRevenueSeries,
  getClosersTable,
  getFreelancersTable,
  getAgenciesTable,
  getAgencyTopFreelancers,
  getAgencyTopClosers,
  getFreelancerTopClosers,
  getFreelancerTopAgencies,
  getCloserTopAgencies,
  getCloserTopFreelancers,
} from "./dashboard-data";

type CardDef = {
  key: string;
  labelKey: string;
  valueKey: string;
  icon: React.ComponentType<{ className?: string }>;
  detailKey: string;
};

const AGENCY_CARDS: CardDef[] = [
  { key: "totalRevenue", labelKey: "dashboard.card.totalRevenue", valueKey: "totalRevenue", icon: DollarSign, detailKey: "deals" },
  { key: "avgConversion", labelKey: "dashboard.card.avgConversion", valueKey: "avgConversion", icon: Percent, detailKey: "leads" },
  { key: "meetingCount", labelKey: "dashboard.card.totalMeetings", valueKey: "meetingCount", icon: Calendar, detailKey: "meetings" },
  { key: "leadsContacted", labelKey: "dashboard.card.leadsContacted", valueKey: "leadsContacted", icon: Users, detailKey: "leads" },
  { key: "leadsThisMonth", labelKey: "dashboard.card.leadsThisMonth", valueKey: "leadsThisMonth", icon: Target, detailKey: "leads" },
  { key: "leadsPending", labelKey: "dashboard.card.leadsPending", valueKey: "leadsPending", icon: Clock, detailKey: "leads" },
  { key: "avgTicket", labelKey: "dashboard.card.avgTicket", valueKey: "avgTicket", icon: TrendingUp, detailKey: "deals" },
  { key: "totalCommissions", labelKey: "dashboard.card.totalCommissions", valueKey: "totalCommissions", icon: Wallet, detailKey: "commissions" },
  { key: "freelancersActive", labelKey: "dashboard.card.freelancersActive", valueKey: "freelancersActive", icon: Briefcase, detailKey: "profiles" },
  { key: "closersPending", labelKey: "dashboard.card.closersPending", valueKey: "closersPending", icon: AlertCircle, detailKey: "commissions" },
  { key: "roi", labelKey: "dashboard.card.roi", valueKey: "roi", icon: BarChart3, detailKey: "deals" },
];

const FREELANCER_CARDS: CardDef[] = [
  { key: "activeAgencies", labelKey: "dashboard.card.activeAgencies", valueKey: "activeAgencies", icon: Users, detailKey: "leads" },
  { key: "leadsAssigned", labelKey: "dashboard.card.leadsAssigned", valueKey: "leadsAssigned", icon: Target, detailKey: "leads" },
  { key: "leadsPending", labelKey: "dashboard.card.leadsPending", valueKey: "leadsPending", icon: Clock, detailKey: "leads" },
  { key: "scheduledMeetings", labelKey: "dashboard.card.scheduledMeetings", valueKey: "scheduledMeetings", icon: Calendar, detailKey: "meetings" },
  { key: "meetingsThisMonth", labelKey: "dashboard.card.meetingsThisMonth", valueKey: "meetingsThisMonth", icon: Calendar, detailKey: "meetings" },
  { key: "closedSales", labelKey: "dashboard.card.closedSales", valueKey: "closedSales", icon: FileCheck, detailKey: "deals" },
  { key: "commissionsThisMonth", labelKey: "dashboard.card.commissionsThisMonth", valueKey: "commissionsThisMonth", icon: Wallet, detailKey: "commissions" },
  { key: "pendingCommissions", labelKey: "dashboard.card.pendingCommissions", valueKey: "pendingCommissions", icon: AlertCircle, detailKey: "commissions" },
  { key: "avgTicket", labelKey: "dashboard.card.avgTicketClosed", valueKey: "avgTicket", icon: TrendingUp, detailKey: "deals" },
  { key: "closeRatio", labelKey: "dashboard.card.closeRatio", valueKey: "closeRatio", icon: Percent, detailKey: "deals" },
];

const CLOSER_EXTRA_CARDS: CardDef[] = [
  { key: "agencyProjects", labelKey: "dashboard.card.agencyProjects", valueKey: "agencyProjects", icon: Briefcase, detailKey: "deals" },
  { key: "agenciesContacted", labelKey: "dashboard.card.agenciesContacted", valueKey: "agenciesContacted", icon: Handshake, detailKey: "agency_contacts" },
  { key: "agenciesWithClose", labelKey: "dashboard.card.agenciesWithClose", valueKey: "agenciesWithClose", icon: FileCheck, detailKey: "agency_contacts" },
];

function buildDetailItems(detailKey: string, detail: Record<string, unknown>): { id: string; label: string; value?: string }[] {
  const arr = detail[detailKey];
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 50).map((item: Record<string, unknown>, i: number) => {
    const id = (item as { id?: string }).id ?? String(i);
    const label = Object.entries(item)
      .filter(([k]) => !["id", "organization_id", "lead_id", "created_at", "updated_at"].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ") || "—";
    return { id, label, value: undefined };
  });
}

export function DashboardContent() {
  const { t } = useLanguage();
  const [role, setRole] = useState<DashboardRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [revenueData, setRevenueData] = useState<{ date: string; total: number }[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("month");
  const [closersTable, setClosersTable] = useState<Record<string, unknown>[]>([]);
  const [freelancersTable, setFreelancersTable] = useState<Record<string, unknown>[]>([]);
  const [agenciesTable, setAgenciesTable] = useState<Record<string, unknown>[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<{ name: string; value: string }[]>([]);
  const [topClosers, setTopClosers] = useState<{ name: string; value: string }[]>([]);
  const [topAgencies, setTopAgencies] = useState<{ name: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ title: string; items: { id: string; label: string; value?: string }[] } | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    setUserId(uid);
    const profileRole = await getProfileRole(uid);
    const r = profileRole ?? (session?.user?.user_metadata?.role as DashboardRole) ?? "agency";
    setRole(r);

    try {
      const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", uid).single();
      const orgId = (profile?.organization_id as string) ?? null;
      setOrganizationId(orgId);

      if (r === "agency" && orgId) {
        const m = await getAgencyMetrics(orgId);
        setMetrics(m as unknown as Record<string, unknown>);
        setClosersTable((await getClosersTable(orgId)) as Record<string, unknown>[]);
        setFreelancersTable((await getFreelancersTable(orgId)) as Record<string, unknown>[]);
        const [rankF, rankC] = await Promise.all([getAgencyTopFreelancers(orgId), getAgencyTopClosers(orgId)]);
        setTopFreelancers(rankF);
        setTopClosers(rankC);
        setTopAgencies([]);
      } else if (r === "freelancer") {
        const m = await getFreelancerMetrics(uid);
        setMetrics(m as unknown as Record<string, unknown>);
        setAgenciesTable((await getAgenciesTable(uid)) as Record<string, unknown>[]);
        setClosersTable([]);
        const [rankC, rankA] = await Promise.all([getFreelancerTopClosers(uid), getFreelancerTopAgencies(uid)]);
        setTopClosers(rankC);
        setTopAgencies(rankA);
        setTopFreelancers([]);
      } else {
        const m = await getCloserMetrics(uid, orgId);
        setMetrics(m as unknown as Record<string, unknown>);
        setAgenciesTable((await getAgenciesTable(uid)) as Record<string, unknown>[]);
        setFreelancersTable(orgId ? ((await getFreelancersTable(orgId)) as Record<string, unknown>[]) : []);
        const [rankA, rankF] = await Promise.all([getCloserTopAgencies(uid), getCloserTopFreelancers(orgId)]);
        setTopAgencies(rankA);
        setTopFreelancers(rankF);
        setTopClosers([]);
      }

      const series = await getRevenueSeries(r === "agency" ? orgId ?? uid : uid, r, "month");
      setRevenueData(series);
    } catch {
      setMetrics({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!userId || !role) return;
    const id = role === "agency" ? organizationId ?? userId : userId;
    getRevenueSeries(id, role, revenuePeriod).then(setRevenueData);
  }, [revenuePeriod, userId, role, organizationId]);

  const cards: CardDef[] =
    role === "agency"
      ? AGENCY_CARDS
      : role === "freelancer"
        ? FREELANCER_CARDS
        : [...AGENCY_CARDS, ...CLOSER_EXTRA_CARDS];

  const openDetail = (card: CardDef) => {
    const detail = (metrics?.detail as Record<string, unknown>) ?? {};
    const items = buildDetailItems(card.detailKey, detail);
    setModal({ title: t(card.labelKey), items });
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-[var(--color-muted)]">Cargando dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--color-title)]">Dashboard</h1>

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Métricas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => {
            const value = metrics?.[card.valueKey] ?? 0;
            const prev = (metrics?.prevMonth as Record<string, unknown>)?.[card.valueKey];
            const prevNum = typeof prev === "number" ? prev : 0;
            const currentNum = typeof value === "number" ? value : 0;
            const percentChange =
              prevNum !== 0 && typeof currentNum === "number"
                ? Math.round(((currentNum - prevNum) / prevNum) * 100)
                : null;
            const displayValue =
              typeof value === "number" && (card.valueKey === "avgConversion" || card.valueKey === "closeRatio" || card.valueKey === "roi")
                ? `${value}%`
                : value;
            const Icon = card.icon;
            return (
              <MetricCard
                key={card.key}
                title={t(card.labelKey)}
                value={displayValue}
                icon={Icon}
                onClick={() => openDetail(card)}
                percentChange={percentChange}
              />
            );
          })}
        </div>
      </section>

      <RevenueChart
        data={revenueData}
        period={revenuePeriod}
        onPeriodChange={setRevenuePeriod}
      />

      <section className="space-y-6" aria-labelledby="tables-heading">
        <h2 id="tables-heading" className="sr-only">
          Tablas de datos
        </h2>
        {role === "agency" && (
          <div className="grid gap-4 sm:grid-cols-2" aria-label="Rankings">
            <RankingSection
              titleKey="dashboard.ranking.top3Freelancers"
              items={topFreelancers}
              icon={Briefcase}
            />
            <RankingSection
              titleKey="dashboard.ranking.top3Closers"
              items={topClosers}
              icon={Target}
            />
          </div>
        )}
        {role === "freelancer" && (
          <div className="grid gap-4 sm:grid-cols-2" aria-label="Rankings">
            <RankingSection
              titleKey="dashboard.ranking.top3Closers"
              items={topClosers}
              icon={Target}
            />
            <RankingSection
              titleKey="dashboard.ranking.top3AgenciesByProjects"
              items={topAgencies}
              icon={Briefcase}
            />
          </div>
        )}
        {role === "closer" && (
          <div className="grid gap-4 sm:grid-cols-2" aria-label="Rankings">
            <RankingSection
              titleKey="dashboard.ranking.top3Agencies"
              items={topAgencies}
              icon={Handshake}
            />
            <RankingSection
              titleKey="dashboard.ranking.top3Freelancers"
              items={topFreelancers}
              icon={Briefcase}
            />
          </div>
        )}
        {role === "agency" && (
          <>
            <DataTableExport
              title={t("dashboard.table.closers")}
              columns={[
                { id: "name", header: t("dashboard.table.name"), accessor: (r) => (r.name as string) ?? "" },
                { id: "status", header: t("dashboard.table.status"), accessor: (r) => ((r.status as string) === "connected" ? t("dashboard.table.statusConnected") : t("dashboard.table.statusDisconnected")) },
                { id: "conversion_rate", header: t("dashboard.table.conversionRate"), accessor: (r) => `${(r.conversion_rate as number) ?? 0}%` },
                { id: "total_sales_eur", header: t("dashboard.table.totalSalesEur"), accessor: (r) => `€${Number((r.total_sales_eur as number) ?? 0).toLocaleString()}` },
                { id: "meetings", header: t("dashboard.table.meetings"), accessor: (r) => String((r.meetings as number) ?? 0) },
                { id: "pending_to_pay", header: t("dashboard.table.pendingToPay"), accessor: (r) => `€${Number((r.pending_to_pay as number) ?? 0).toLocaleString()}` },
              ]}
              data={closersTable}
              onImport={(rows) => setClosersTable(rows as Record<string, unknown>[])}
            />
            <DataTableExport
              title={t("dashboard.table.freelancers")}
              columns={[
                { id: "name", header: t("dashboard.table.name"), accessor: (r) => (r.name as string) ?? "" },
                { id: "email", header: t("dashboard.table.email"), accessor: (r) => (r.email as string) ?? "" },
                { id: "project", header: t("dashboard.table.project"), accessor: (r) => (r.project as string) ?? "—" },
                { id: "price", header: t("dashboard.table.price"), accessor: (r) => `€${Number((r.price as number) ?? 0).toLocaleString()}` },
                { id: "percent_completed", header: t("dashboard.table.percentCompleted"), accessor: (r) => `${(r.percent_completed as number) ?? 0}%` },
              ]}
              data={freelancersTable}
              onImport={(rows) => setFreelancersTable(rows as Record<string, unknown>[])}
            />
          </>
        )}
        {(role === "freelancer" || role === "closer") && (
          <>
            <DataTableExport
              title={t("dashboard.table.agencies")}
              columns={[
                { id: "name", header: t("dashboard.table.name"), accessor: (r) => (r.name as string) ?? "" },
                { id: "slug", header: "Slug", accessor: (r) => (r.slug as string) ?? "" },
              ]}
              data={agenciesTable}
              onImport={(rows) => setAgenciesTable(rows as Record<string, unknown>[])}
            />
            {role === "closer" && (
              <DataTableExport
                title={t("dashboard.table.freelancers")}
                columns={[
                  { id: "name", header: t("dashboard.table.name"), accessor: (r) => (r.name as string) ?? "" },
                  { id: "email", header: t("dashboard.table.email"), accessor: (r) => (r.email as string) ?? "" },
                  { id: "project", header: t("dashboard.table.project"), accessor: (r) => (r.project as string) ?? "—" },
                  { id: "price", header: t("dashboard.table.price"), accessor: (r) => `€${Number((r.price as number) ?? 0).toLocaleString()}` },
                  { id: "percent_completed", header: t("dashboard.table.percentCompleted"), accessor: (r) => `${(r.percent_completed as number) ?? 0}%` },
                ]}
                data={freelancersTable}
                onImport={(rows) => setFreelancersTable(rows as Record<string, unknown>[])}
              />
            )}
          </>
        )}
      </section>

      {modal && (
        <DetailModal
          open={!!modal}
          onClose={() => setModal(null)}
          title={modal.title}
          items={modal.items}
        />
      )}
    </div>
  );
}
