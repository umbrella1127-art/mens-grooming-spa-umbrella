// 集客KPI基盤（HPB分析）の管理画面向けデータ取得。
// 書き込みは scripts/hpb/*.py（ローカルPCから直接DB接続）が行う。ここは閲覧のみ。
// スキーマ: supabase/migrations/0027_kpi_analysis.sql、運用: scripts/hpb/GUIDE.md
import { getServerClient } from "@/lib/supabase/server";

export interface HpbStore {
  code: string;
  name: string;
  area: string | null;
  hpbCd: string | null;
  planCostYen: Record<string, number> | null;
  planCostNote: string | null;
}

export interface HpbMonthlyKpiRow {
  store: string;
  month: string;
  plan: string | null;
  planCostYen: number | null;
  customersNew: number | null;
  netReservations: number | null;
  salesManYen: number | null;
  unitPriceYen: number | null;
  cvr: number | null;
  acr: number | null;
  newRepeatRate: number | null;
  dataStatus: string;
  cpaYen: number | null;
}

export interface HpbFinding {
  id: number;
  store: string;
  month: string;
  severity: "critical" | "warning" | "info" | "good";
  title: string;
  detail: string;
  agent: string;
  ackedAt: string | null;
}

export interface HpbStrategy {
  id: number;
  store: string;
  month: string;
  priority: number;
  title: string;
  rationale: string;
  status: string;
  expectedEffect: string | null;
}

export interface HpbReportSummary {
  store: string;
  month: string;
  title: string;
  headline: string | null;
  createdAt: string;
}

export interface HpbData {
  available: boolean;
  stores: HpbStore[];
  monthlyKpi: HpbMonthlyKpiRow[];
  findings: HpbFinding[];
  strategies: HpbStrategy[];
  reports: HpbReportSummary[];
}

function cpa(planCostYen: number | null, customersNew: number | null) {
  if (!planCostYen || !customersNew) return null;
  return Math.round(planCostYen / customersNew);
}

export async function getHpbData(): Promise<HpbData> {
  const supabase = await getServerClient();

  const [storesRes, kpiRes, findingsRes, strategiesRes, reportsRes] =
    await Promise.all([
      supabase.from("stores").select("*").eq("active", true),
      supabase
        .from("hpb_monthly_kpi")
        .select(
          "store, month, plan, plan_cost_yen, customers_new, net_reservations, sales_man_yen, unit_price_yen, cvr, acr, new_repeat_rate, data_status",
        )
        .order("month", { ascending: false })
        .limit(24),
      supabase
        .from("findings")
        .select("id, store, month, severity, title, detail, agent, acked_at")
        .eq("channel", "hpb")
        .is("acked_at", null)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("strategies")
        .select("id, store, month, priority, title, rationale, status, expected_effect")
        .eq("channel", "hpb")
        .in("status", ["proposed", "adopted"])
        .order("priority", { ascending: true })
        .limit(20),
      supabase
        .from("analysis_reports")
        .select("store, month, title, headline, created_at")
        .eq("channel", "hpb")
        .order("month", { ascending: false })
        .limit(12),
    ]);

  const available = !storesRes.error;

  const stores: HpbStore[] = (storesRes.data ?? []).map((s) => ({
    code: s.code,
    name: s.name,
    area: s.area,
    hpbCd: s.hpb_cd,
    planCostYen: s.plan_cost_yen,
    planCostNote: s.plan_cost_note,
  }));

  const monthlyKpi: HpbMonthlyKpiRow[] = (kpiRes.data ?? []).map((r) => ({
    store: r.store,
    month: r.month,
    plan: r.plan,
    planCostYen: r.plan_cost_yen,
    customersNew: r.customers_new,
    netReservations: r.net_reservations,
    salesManYen: r.sales_man_yen,
    unitPriceYen: r.unit_price_yen,
    cvr: r.cvr,
    acr: r.acr,
    newRepeatRate: r.new_repeat_rate,
    dataStatus: r.data_status,
    cpaYen: cpa(r.plan_cost_yen, r.customers_new),
  }));

  const findings: HpbFinding[] = (findingsRes.data ?? []).map((f) => ({
    id: f.id,
    store: f.store,
    month: f.month,
    severity: f.severity,
    title: f.title,
    detail: f.detail,
    agent: f.agent,
    ackedAt: f.acked_at,
  }));

  const strategies: HpbStrategy[] = (strategiesRes.data ?? []).map((s) => ({
    id: s.id,
    store: s.store,
    month: s.month,
    priority: s.priority,
    title: s.title,
    rationale: s.rationale,
    status: s.status,
    expectedEffect: s.expected_effect,
  }));

  const reports: HpbReportSummary[] = (reportsRes.data ?? []).map((r) => ({
    store: r.store,
    month: r.month,
    title: r.title,
    headline: r.headline,
    createdAt: r.created_at,
  }));

  return { available, stores, monthlyKpi, findings, strategies, reports };
}

export interface HpbReportDetail {
  store: string;
  month: string;
  title: string;
  headline: string | null;
  summaryMd: string | null;
  sections: { heading: string; body_md: string }[];
  kpi: Record<string, number | string>;
  createdAt: string;
}

export async function getHpbReport(
  month: string,
): Promise<HpbReportDetail | null> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("analysis_reports")
    .select("store, month, title, headline, summary_md, sections, kpi, created_at")
    .eq("channel", "hpb")
    .eq("month", month)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    store: data.store,
    month: data.month,
    title: data.title,
    headline: data.headline,
    summaryMd: data.summary_md,
    sections: data.sections ?? [],
    kpi: data.kpi ?? {},
    createdAt: data.created_at,
  };
}
