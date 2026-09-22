// 自律改善の変更（improvement_changes）。起草は修繕担当、反映・差し戻しはローカルPCの scripts/improve/improve.py。
import { getServerClient } from "@/lib/supabase/server";

export type ChangeStatus =
  | "drafted"
  | "awaiting_approval"
  | "approved"
  | "applied"
  | "kept"
  | "reverted"
  | "rejected"
  | "stale"
  | "failed";

export const CHANGE_STATUS_LABEL: Record<ChangeStatus, string> = {
  drafted: "下書き",
  awaiting_approval: "承認待ち",
  approved: "承認済み（次の定期実行で反映）",
  applied: "反映済み（効果を確認中）",
  kept: "効果あり・そのまま",
  reverted: "効果なし・元に戻した",
  rejected: "却下",
  stale: "対象が変わったため保留",
  failed: "反映できなかった",
};

export const METRIC_LABEL: Record<string, string> = {
  run_error_rate: "工程の失敗の割合",
  issue_count: "異常の件数（1日あたり）",
  rules_ng_rate: "ルール要確認の割合",
};

export interface ImprovementChange {
  id: number;
  summary: string;
  files: string[];
  diff: string;
  gate: "auto" | "approval" | "forbidden";
  gateReasons: string[];
  status: ChangeStatus;
  watch: string;
  verifyAfter: string | null;
  note: string | null;
  proposal: string | null;
  createdAt: string;
}

export async function getImprovements(limit = 20): Promise<{ available: boolean; changes: ImprovementChange[] }> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("improvement_changes")
    .select(
      "id, summary, files, diff, gate, gate_reasons, status, watch_metric, watch_target, verify_after, note, created_at, improvement_proposals(proposal)",
    )
    .order("id", { ascending: false })
    .limit(limit);
  if (error) return { available: false, changes: [] };
  return {
    available: true,
    changes: (data ?? []).map((c) => {
      const p = c.improvement_proposals as { proposal?: string } | { proposal?: string }[] | null;
      return {
        id: c.id,
        summary: c.summary,
        files: c.files ?? [],
        diff: c.diff,
        gate: c.gate,
        gateReasons: c.gate_reasons ?? [],
        status: c.status as ChangeStatus,
        watch: `${METRIC_LABEL[c.watch_metric] ?? c.watch_metric}（${c.watch_target}）`,
        verifyAfter: c.verify_after,
        note: c.note,
        proposal: (Array.isArray(p) ? p[0]?.proposal : p?.proposal) ?? null,
        createdAt: c.created_at,
      };
    }),
  };
}
