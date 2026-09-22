"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./helpers";

const KPIS = ["line_click", "page_views", "sessions", "engagement_sec"];
const DECISIONS = ["pending", "adopted", "rolled_back"];

/**
 * サイトを変えたときに「実験」として登録する。
 * 判定（変更前後の比較）は scripts/site/daily.py が測定期間の終わった翌朝に行う。
 * 測り方の無い登録はDB側の制約（0031_site_experiments.sql）でも拒否される。
 */
export async function createExperiment(formData: FormData) {
  const supabase = await requireAdmin();

  const whatChanged = String(formData.get("what_changed") ?? "").trim();
  const hypothesis = String(formData.get("hypothesis") ?? "").trim();
  const expected = String(formData.get("expected") ?? "").trim();
  const targetPage = String(formData.get("target_page") ?? "").trim();
  const kpi = String(formData.get("kpi") ?? "");
  const startDay = String(formData.get("start_day") ?? "");
  const measureDays = Number(formData.get("measure_days"));

  if (!whatChanged || !hypothesis || !expected) {
    throw new Error("「何を変えたか」「なぜ」「どうなるはずか」をすべて書いてください");
  }
  if (targetPage !== "(all)" && !targetPage.startsWith("/")) {
    throw new Error("ページは / から始まるパス（例 /menu/facial）か「(all)」を指定してください");
  }
  if (!KPIS.includes(kpi)) throw new Error("測る指標を選んでください");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDay)) throw new Error("変えた日を指定してください");
  if (![7, 14, 28].includes(measureDays)) throw new Error("測る期間を選んでください");

  const year = startDay.slice(0, 4);
  const { count } = await supabase
    .from("experiments")
    .select("id", { count: "exact", head: true })
    .like("code", `EXP-${year}-%`);
  const code = `EXP-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { error } = await supabase.from("experiments").insert({
    code,
    name: whatChanged.slice(0, 60),
    what_changed: whatChanged,
    hypothesis,
    expected,
    target_page: targetPage,
    kpi,
    started_at: `${startDay}T00:00:00+09:00`,
    measure_days: measureDays,
    source: "admin",
  });
  if (error) throw new Error(`登録に失敗しました (${error.message})`);

  revalidatePath("/admin/ga4");
  redirect("/admin/ga4?exp=saved#experiments");
}

/** 判定を見て「採用」「元に戻した」を記録する（戻す作業そのものは管理画面で人が行う）。 */
export async function decideExperiment(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || !DECISIONS.includes(decision)) throw new Error("指定が不正です");

  const { error } = await supabase.from("experiments").update({ decision }).eq("id", id);
  if (error) throw new Error(`更新に失敗しました (${error.message})`);

  revalidatePath("/admin/ga4");
}
