// 実行ごとの振り返り（4層）と、そこから出た改善案。書き込みは scripts/reflect/reflect.py。
import { getServerClient } from "@/lib/supabase/server";

export type ReflectionChannel = "threads" | "hpb" | "site" | "gbp" | "seo";
export type ProposalKind = "system" | "business";
export type ProposalStatus = "open" | "reported" | "accepted" | "applied" | "rejected";

export const TARGET_LABEL: Record<string, string> = {
  agent: "担当の定義",
  skill: "手順書",
  code: "プログラム",
  rule: "ルール",
  data: "データ",
  content: "中身・言葉",
  timing: "時刻・頻度",
  offer: "メニューの見せ方",
  channel: "出す場所",
  other: "その他",
};

export const STATUS_LABEL: Record<ProposalStatus, string> = {
  open: "未確認",
  reported: "点検担当が報告済み",
  accepted: "採用",
  applied: "反映済み",
  rejected: "見送り",
};

export interface Reflection {
  id: number;
  agent: string;
  runRef: string;
  createdAt: string;
  output: string;
  urls: string[];
  did: string;
  selfCheck: string;
  rulesOk: boolean;
}

export interface Proposal {
  id: number;
  kind: ProposalKind;
  agent: string;
  target: string;
  targetRef: string | null;
  proposal: string;
  reason: string;
  status: ProposalStatus;
  createdAt: string;
}

export interface ReflectionsData {
  available: boolean;
  reflections: Reflection[];
  system: Proposal[];
  business: Proposal[];
}

export async function getReflections(
  channel: ReflectionChannel,
  limit = 8,
): Promise<ReflectionsData> {
  const supabase = await getServerClient();
  const [refl, props] = await Promise.all([
    supabase
      .from("run_reflections")
      .select("id, agent, run_ref, created_at, output_summary, output_urls, did, self_check, rules_ok")
      .eq("channel", channel)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("improvement_proposals")
      .select("id, kind, target, target_ref, proposal, reason, status, created_at, run_reflections(agent)")
      .eq("channel", channel)
      .in("status", ["open", "reported"])
      .order("created_at", { ascending: false })
      .limit(40),
  ]);
  if (refl.error || props.error) {
    return { available: false, reflections: [], system: [], business: [] };
  }

  const proposals: Proposal[] = (props.data ?? []).map((p) => {
    const parent = p.run_reflections as { agent?: string } | { agent?: string }[] | null;
    const agent = Array.isArray(parent) ? parent[0]?.agent : parent?.agent;
    return {
      id: p.id,
      kind: p.kind as ProposalKind,
      agent: agent ?? "",
      target: p.target,
      targetRef: p.target_ref,
      proposal: p.proposal,
      reason: p.reason,
      status: p.status as ProposalStatus,
      createdAt: p.created_at,
    };
  });

  return {
    available: true,
    reflections: (refl.data ?? []).map((r) => ({
      id: r.id,
      agent: r.agent,
      runRef: r.run_ref,
      createdAt: r.created_at,
      output: r.output_summary,
      urls: r.output_urls ?? [],
      did: r.did,
      selfCheck: r.self_check,
      rulesOk: r.rules_ok,
    })),
    system: proposals.filter((p) => p.kind === "system"),
    business: proposals.filter((p) => p.kind === "business"),
  };
}
