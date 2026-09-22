// サイト改善の実験（experiments）の読み取り。判定は scripts/site/daily.py が毎朝行う。
import { getServerClient } from "@/lib/supabase/server";

export type ExperimentKpi = "line_click" | "page_views" | "sessions" | "engagement_sec";
export type ExperimentVerdict = "win" | "lose" | "flat" | "insufficient";
export type ExperimentDecision = "pending" | "adopted" | "rolled_back";

export const KPI_OPTIONS: { value: ExperimentKpi; label: string }[] = [
  { value: "line_click", label: "LINEクリック率（最重要）" },
  { value: "page_views", label: "ページの閲覧数" },
  { value: "engagement_sec", label: "滞在時間" },
  { value: "sessions", label: "訪問数" },
];

export const VERDICT_LABEL: Record<ExperimentVerdict, string> = {
  win: "効いた",
  lose: "逆効果",
  flat: "差なし",
  insufficient: "判定保留",
};

export const DECISION_LABEL: Record<ExperimentDecision, string> = {
  pending: "未決定",
  adopted: "採用",
  rolled_back: "元に戻した",
};

// 公開サイトのページ（入力補助。一覧に無いページも手入力できる）
export const SITE_PAGES = [
  "(all)",
  "/",
  "/menu",
  "/menu/head-spa",
  "/menu/facial",
  "/menu/hair-growth",
  "/menu/first-grooming",
  "/menu/shaving",
  "/menu/slimming",
  "/menu/inner-beauty",
  "/first-visit",
  "/membership",
  "/about",
  "/access",
  "/faq",
  "/gift",
  "/blog",
  "/reserve",
];

export interface WindowStats {
  start: string;
  end: string;
  days: number;
  days_with_data: number;
  sessions: number;
  line_click?: number;
  value: number;
}

export interface Experiment {
  id: string;
  code: string;
  name: string;
  whatChanged: string;
  hypothesis: string;
  expected: string;
  targetPage: string;
  kpi: ExperimentKpi;
  startDay: string;
  measureDays: number;
  endDay: string;
  verdict: ExperimentVerdict | null;
  decision: ExperimentDecision;
  resultSummary: string | null;
  before: WindowStats | null;
  after: WindowStats | null;
}

function jstDay(iso: string) {
  return new Date(new Date(iso).getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export interface SiteExperiments {
  available: boolean;
  experiments: Experiment[];
  dataThrough: string | null;
}

export async function getSiteExperiments(): Promise<SiteExperiments> {
  const supabase = await getServerClient();
  const [{ data, error }, { data: last }] = await Promise.all([
    supabase
      .from("experiments")
      .select(
        "id, code, name, what_changed, hypothesis, expected, target_page, kpi, started_at, measure_days, verdict, decision, result_summary, before_stats, after_stats",
      )
      .order("started_at", { ascending: false })
      .limit(50),
    supabase.from("site_metrics_daily").select("day").order("day", { ascending: false }).limit(1),
  ]);
  if (error) return { available: false, experiments: [], dataThrough: null };

  return {
    available: true,
    dataThrough: last?.[0]?.day ?? null,
    experiments: (data ?? []).map((e) => {
      const startDay = jstDay(e.started_at);
      return {
        id: e.id,
        code: e.code,
        name: e.name,
        whatChanged: e.what_changed,
        hypothesis: e.hypothesis,
        expected: e.expected,
        targetPage: e.target_page,
        kpi: e.kpi as ExperimentKpi,
        startDay,
        measureDays: e.measure_days,
        endDay: addDays(startDay, e.measure_days),
        verdict: e.verdict as ExperimentVerdict | null,
        decision: e.decision as ExperimentDecision,
        resultSummary: e.result_summary,
        before: e.before_stats as WindowStats | null,
        after: e.after_stats as WindowStats | null,
      };
    }),
  };
}
