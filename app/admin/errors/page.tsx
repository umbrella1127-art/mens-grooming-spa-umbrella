import AutoRefresh from "@/components/admin/AutoRefresh";
import { Badge, Card, Empty } from "@/components/admin/board";
import type { Tone } from "@/lib/admin/board";
import { getServerClient } from "@/lib/supabase/server";

// 毎回DBを読み直す（静的化しない）
export const dynamic = "force-dynamic";

interface Issue {
  id: number;
  channel: string;
  kind: string;
  severity: string;
  title: string;
  detail: string | null;
  evidence: { needs_human?: boolean; escalated?: string } | null;
  action_taken: string | null;
  status: string;
  detected_at: string;
  resolved_at: string | null;
  resolve_note: string | null;
}

const SEV: Record<string, Tone> = { critical: "bad", warning: "warn", info: "info" };

function mdhm(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function IssueRow({ i }: { i: Issue }) {
  const human = i.status === "open" && i.evidence?.needs_human;
  return (
    <li className="border-b border-beige py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
        {human ? <Badge tone="bad">要確認</Badge> : <Badge tone={SEV[i.severity] ?? "info"}>{i.severity}</Badge>}
        <span className="text-ink">{i.title}</span>
        <span className="ml-auto text-[11px] tabular-nums text-greige">{mdhm(i.detected_at)}</span>
      </div>
      {i.evidence?.escalated && (
        <p className="mt-1 text-[11.5px] text-[#8f3826]">依頼: {i.evidence.escalated}</p>
      )}
      {i.action_taken && <p className="mt-1 text-[11.5px] text-charcoal-light">対応: {i.action_taken}</p>}
      {i.resolve_note && (
        <p className="mt-1 text-[11.5px] text-[#3d6a4c]">
          解決{i.resolved_at ? `（${mdhm(i.resolved_at)}）` : ""}: {i.resolve_note}
        </p>
      )}
      {i.detail && <p className="mt-1 whitespace-pre-line text-[11px] text-greige">{i.detail.trim()}</p>}
    </li>
  );
}

export default async function ErrorsPage() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("pipeline_issues")
    .select(
      "id, channel, kind, severity, title, detail, evidence, action_taken, status, detected_at, resolved_at, resolve_note",
    )
    .order("detected_at", { ascending: false })
    .limit(60);
  const issues = (data ?? []) as Issue[];
  const open = issues.filter((i) => i.status === "open");
  const needsHuman = open.filter((i) => i.evidence?.needs_human);
  const auto = open.filter((i) => !i.evidence?.needs_human);
  const done = issues.filter((i) => i.status !== "open").slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">ERRORS</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">エラー監視</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[12.5px] text-charcoal-light">
            監視担当が2時間おきに点検し、決まった範囲は自動で直します。直せないものは修復担当が調べ、
            人の確認が必要なものはこことDiscordに出ます。
          </p>
          <AutoRefresh seconds={60} />
        </div>
      </div>

      {error ? (
        <Card eyebrow="STATUS" title="読み込めませんでした">
          <Empty>異常の記録を読めませんでした: {error.message}</Empty>
        </Card>
      ) : (
        <>
          <Card
            eyebrow="ACTION"
            title="あなたの確認が必要"
            aside={`${needsHuman.length}件`}
          >
            {needsHuman.length === 0 ? (
              <Empty>確認が必要な異常はありません。</Empty>
            ) : (
              <ul>{needsHuman.map((i) => <IssueRow key={i.id} i={i} />)}</ul>
            )}
          </Card>
          <Card eyebrow="WATCHING" title="対応中・経過観察" aside={`${auto.length}件`}>
            {auto.length === 0 ? <Empty>ありません。</Empty> : <ul>{auto.map((i) => <IssueRow key={i.id} i={i} />)}</ul>}
          </Card>
          <Card eyebrow="HISTORY" title="直近の解決済み">
            {done.length === 0 ? <Empty>まだありません。</Empty> : <ul>{done.map((i) => <IssueRow key={i.id} i={i} />)}</ul>}
          </Card>
        </>
      )}
    </div>
  );
}
