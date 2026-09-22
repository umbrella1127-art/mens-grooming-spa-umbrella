// Threads検証→ブログ化基盤の管理画面向けデータ取得（閲覧のみ）。
// 書き込みは scripts/threads/*.py（ローカルPCから直接DB接続）が行う。
// スキーマ: supabase/migrations/0029_threads_pipeline.sql, 0030_threads_ops.sql、運用: scripts/threads/GUIDE.md
import { getServerClient } from "@/lib/supabase/server";

export interface ThreadsTrial {
  id: number;
  trialDate: string;
  slot: number;
  status: string;
  hook: string | null;
  postText: string;
  views: number | null;
  score: number | null;
  isWinner: boolean;
  topicTitle: string | null;
  ageBand: string | null;
  pillar: string | null;
  resultNote: string | null;
  t1: TrialSnapshot | null;
  t7: TrialSnapshot | null;
}

export type TrialVerdict = "win" | "lead" | "flat" | "lose" | "insufficient";

/** T+1 / T+7 の実測と判定（scripts/threads/judge.py） */
export interface TrialSnapshot {
  views: number;
  verdict: TrialVerdict | null;
  hit: "hit" | "partial" | "miss" | null;
  note: string | null;
}

export interface ThreadsIssue {
  id: number;
  detectedAt: string;
  kind: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string | null;
  actionTaken: string | null;
}

export interface ThreadsRun {
  ranAt: string;
  routine: string;
  status: "ok" | "partial" | "error";
  summary: string | null;
}

export type KnowledgeStatus = "candidate" | "adopted" | "retired";

export interface ThreadsKnowledge {
  id: string;
  title: string;
  body: string;
  category: string;
  updatedAt: string;
  kind: "pattern" | "summary" | "ops" | null;
  status: KnowledgeStatus | null;
  retiredReason: string | null;
  support: number;
  contradict: number;
}

export interface RosterMember {
  agent: string;
  displayName: string;
  kana: string | null;
  age: number | null;
  roleTitle: string;
  team: string;
  icon: string | null;
  catchphrase: string | null;
  personality: string | null;
  channel: string;
}

export interface ThreadsData {
  available: boolean;
  stock: number; // 未テストの新鮮ネタ
  winnersWaiting: number; // priority=true・未記事化
  trials: ThreadsTrial[]; // 直近14日
  pendingBlogDrafts: number;
  issues: ThreadsIssue[];
  runs: ThreadsRun[];
  knowledge: ThreadsKnowledge[];
  roster: RosterMember[];
}

type SnapshotRow = {
  days_after: number;
  views: number | string;
  verdict: string | null;
  prediction_hit: string | null;
  note: string | null;
};

function snapshotOf(rows: SnapshotRow[] | null | undefined, daysAfter: number): TrialSnapshot | null {
  const s = (rows ?? []).find((x) => x.days_after === daysAfter);
  if (!s) return null;
  return {
    views: Number(s.views),
    verdict: s.verdict as TrialVerdict | null,
    hit: s.prediction_hit as TrialSnapshot["hit"],
    note: s.note,
  };
}

export async function getThreadsData(): Promise<ThreadsData> {
  const supabase = await getServerClient();
  const since = new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);

  const [topicsRes, testedRes, trialsRes, draftsRes, issuesRes, runsRes, knowledgeRes, rosterRes] =
    await Promise.all([
      supabase
        .from("threads_topics")
        .select("id, title, age_band, status, priority, post_id, research_notes"),
      supabase.from("threads_trials").select("topic_id").not("topic_id", "is", null),
      supabase
        .from("threads_trials")
        .select(
          "id, trial_date, slot, status, hook, post_text, metrics, reaction_score, is_winner, topic_id, result_note, threads_trial_snapshots(days_after, views, verdict, prediction_hit, note)",
        )
        .gte("trial_date", since)
        .order("trial_date", { ascending: false })
        .order("slot", { ascending: true }),
      supabase
        .from("content_drafts")
        .select("id", { count: "exact", head: true })
        .eq("channel_type", "blog")
        .eq("status", "pending"),
      supabase
        .from("pipeline_issues")
        .select("id, detected_at, kind, severity, title, detail, action_taken")
        .eq("channel", "threads")
        .eq("status", "open")
        .order("detected_at", { ascending: false })
        .limit(20),
      supabase
        .from("agent_runs")
        .select("ran_at, routine, status, summary")
        .like("routine", "threads:%")
        .order("ran_at", { ascending: false })
        .limit(12),
      supabase
        .from("knowledge")
        .select("id, title, body, category, updated_at, kind, status, retired_reason, knowledge_evidence(outcome)")
        .eq("source", "threads")
        .order("updated_at", { ascending: false })
        .limit(30),
      supabase
        .from("agent_roster")
        .select("agent, display_name, kana, age, role_title, team, icon, catchphrase, personality, channel")
        .order("channel")
        .order("sort_order"),
    ]);

  const available = !topicsRes.error && !trialsRes.error;
  const topics = topicsRes.data ?? [];
  const tested = new Set((testedRes.data ?? []).map((t) => t.topic_id as number));
  const topicById = new Map(topics.map((t) => [t.id as number, t]));

  const stock = topics.filter(
    (t) => t.status === "active" && !t.priority && !tested.has(t.id as number),
  ).length;
  const winnersWaiting = topics.filter(
    (t) => t.priority && !t.post_id && t.status !== "closed",
  ).length;

  const trials: ThreadsTrial[] = (trialsRes.data ?? []).map((r) => {
    const topic = r.topic_id ? topicById.get(r.topic_id as number) : undefined;
    const notes = (topic?.research_notes ?? null) as { pillar?: string } | null;
    const metrics = (r.metrics ?? null) as { views?: number } | null;
    return {
      id: r.id,
      trialDate: r.trial_date,
      slot: r.slot,
      status: r.status,
      hook: r.hook,
      postText: r.post_text,
      views: metrics?.views ?? null,
      score: r.reaction_score === null ? null : Number(r.reaction_score),
      isWinner: r.is_winner,
      topicTitle: topic?.title ?? null,
      ageBand: topic?.age_band ?? null,
      pillar: notes?.pillar ?? null,
      resultNote: r.result_note,
      t1: snapshotOf(r.threads_trial_snapshots, 1),
      t7: snapshotOf(r.threads_trial_snapshots, 7),
    };
  });

  return {
    available,
    stock,
    winnersWaiting,
    trials,
    pendingBlogDrafts: draftsRes.count ?? 0,
    issues: (issuesRes.data ?? []).map((i) => ({
      id: i.id,
      detectedAt: i.detected_at,
      kind: i.kind,
      severity: i.severity,
      title: i.title,
      detail: i.detail,
      actionTaken: i.action_taken,
    })),
    runs: (runsRes.data ?? []).map((r) => ({
      ranAt: r.ran_at,
      routine: r.routine,
      status: r.status,
      summary: r.summary,
    })),
    knowledge: (knowledgeRes.data ?? []).map((k) => ({
      id: k.id,
      title: k.title,
      body: k.body,
      category: k.category,
      updatedAt: k.updated_at,
      kind: k.kind,
      status: k.status,
      retiredReason: k.retired_reason,
      support: (k.knowledge_evidence ?? []).filter((e: { outcome: string }) => e.outcome === "support").length,
      contradict: (k.knowledge_evidence ?? []).filter((e: { outcome: string }) => e.outcome === "contradict")
        .length,
    })),
    roster: (rosterRes.data ?? []).map((m) => ({
      agent: m.agent,
      displayName: m.display_name,
      kana: m.kana,
      age: m.age,
      roleTitle: m.role_title,
      team: m.team,
      icon: m.icon,
      catchphrase: m.catchphrase,
      personality: m.personality,
      channel: m.channel,
    })),
  };
}
