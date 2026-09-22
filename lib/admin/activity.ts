// 稼働タイムライン（/admin/activity）。「今どの担当が何をしているか」を1画面で見る。
// 出どころ: agent_runs（Threads・サイト・クラウドの定期実行）/ analysis_runs + agent_tasks（HPB）/
//           run_reflections（振り返り）/ pipeline_issues（異常）/ experiments（サイト改善）
// 組み立て（時間割との突き合わせ・ツリー・ログ）は lib/admin/activity-build.ts。
import { getServerClient } from "@/lib/supabase/server";
import { buildActivity, jstDay, type ActivityData } from "./activity-build";

export * from "./activity-build";

export async function getActivity(): Promise<ActivityData> {
  const supabase = await getServerClient();
  const nowMs = Date.now();
  const since48 = new Date(nowMs - 48 * 3_600_000).toISOString();

  const [runsRes, hpbRunsRes, tasksRes, reflRes, issuesRes, expRes, rosterRes] = await Promise.all([
    supabase
      .from("agent_runs")
      .select("id, routine, status, started_at, finished_at, ran_at, summary")
      .gte("ran_at", since48)
      .order("ran_at", { ascending: false })
      .limit(200),
    supabase
      .from("analysis_runs")
      .select("id, kind, month, status, started_at, finished_at, summary")
      .order("started_at", { ascending: false })
      .limit(5),
    supabase
      .from("agent_tasks")
      .select("id, run_id, agent, role, status, started_at, finished_at, output_note, error")
      .order("id", { ascending: false })
      .limit(80),
    supabase
      .from("run_reflections")
      .select("id, channel, agent, run_ref, rules_ok, output_summary, created_at")
      .gte("created_at", since48)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("pipeline_issues")
      .select("id, severity, title, detected_at")
      .gte("detected_at", since48)
      .order("detected_at", { ascending: false })
      .limit(20),
    supabase
      .from("experiments")
      .select("id, code, name, verdict, measured_at, created_at")
      .or(`measured_at.gte."${since48}",created_at.gte."${since48}"`)
      .limit(20),
    supabase.from("agent_roster").select("agent, display_name, role_title, icon"),
  ]);

  if (runsRes.error) {
    return { available: false, today: jstDay().iso, generatedAt: new Date().toISOString(), now: [], slots: [], extraRuns: [], trees: [], feed: [] };
  }

  return buildActivity(
    {
      runs: runsRes.data ?? [],
      hpbRuns: hpbRunsRes.data ?? [],
      tasks: tasksRes.data ?? [],
      reflections: reflRes.data ?? [],
      issues: issuesRes.data ?? [],
      experiments: expRes.data ?? [],
      roster: rosterRes.data ?? [],
    },
    nowMs,
  );
}
