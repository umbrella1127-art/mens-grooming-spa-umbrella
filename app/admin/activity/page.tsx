import AutoRefresh from "@/components/admin/AutoRefresh";
import ImprovementChanges from "@/components/admin/ImprovementChanges";
import { Badge, Card, Empty } from "@/components/admin/board";
import type { Tone } from "@/lib/admin/board";
import { getActivity, type Slot, type SlotState, type TreeNode } from "@/lib/admin/activity";
import { getImprovements } from "@/lib/admin/improvements";

// 毎回DBを読み直す（静的化しない）
export const dynamic = "force-dynamic";

const STATE: Record<SlotState, { label: string; tone: Tone }> = {
  running: { label: "実行中", tone: "info" },
  ok: { label: "完了", tone: "ok" },
  partial: { label: "一部のみ", tone: "warn" },
  error: { label: "失敗", tone: "bad" },
  stalled: { label: "止まっている可能性", tone: "bad" },
  waiting: { label: "起動待ち", tone: "info" },
  planned: { label: "予定", tone: "info" },
  missing: { label: "記録なし", tone: "warn" },
  untracked: { label: "通知のみ", tone: "info" },
};

const TREE_TONE: Record<string, Tone> = { ok: "ok", partial: "warn", error: "bad", running: "info" };

const TEAM_COLOR: Record<Slot["team"], string> = {
  サイト: "bg-[#e6ede7] text-[#3d6a4c]",
  Threads: "bg-paper-dark text-charcoal-light",
  HPB: "bg-[#f2e8d5] text-[#8a621a]",
  企画: "bg-[#ece6ef] text-[#5b4a66]",
};

function hm(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function mdhm(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function minutesBetween(a: string | null, b: string | null) {
  if (!a || !b) return null;
  const m = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60_000);
  return m >= 0 ? m : null;
}

function Tree({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <li className={depth > 0 ? "border-l border-beige pl-4" : ""}>
      <div className="flex flex-wrap items-baseline gap-2 py-1.5 text-[12.5px]">
        <Badge tone={TREE_TONE[node.status] ?? "info"}>{STATE[node.status as SlotState]?.label ?? node.status}</Badge>
        <span className="text-ink">{node.label}</span>
        {node.at && <span className="text-[11px] tabular-nums text-greige">{hm(node.at)}</span>}
      </div>
      {node.note && <p className="-mt-1 pb-1.5 text-[11.5px] text-charcoal-light">{node.note}</p>}
      {node.children.length > 0 && (
        <ul className="ml-1.5">
          {node.children.map((c) => (
            <Tree key={c.key} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default async function ActivityPage() {
  const [d, improvements] = await Promise.all([getActivity(), getImprovements()]);
  const problems = d.slots.filter((s) => ["error", "stalled", "missing"].includes(s.state));
  const next = d.slots.find((s) => s.state === "planned" || s.state === "waiting");

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">ACTIVITY</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">稼働タイムライン</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[12.5px] text-charcoal-light">
            今どの担当が何をしているか、今日の予定がどこまで進んだか。最終更新 {hm(d.generatedAt)}
          </p>
          <AutoRefresh seconds={60} />
        </div>
      </div>

      {!d.available ? (
        <Card eyebrow="STATUS" title="準備中">
          <Empty>
            実行記録を読めませんでした。supabase/migrations/0035_activity_timeline.sql が適用されているか確認してください。
          </Empty>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card eyebrow="NOW" title="いま動いている">
              {d.now.length === 0 ? (
                <Empty>いま動いている担当はいません。</Empty>
              ) : (
                <ul className="space-y-2">
                  {d.now.map((n) => (
                    <li key={n.key} className="text-[12.5px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={n.stalled ? "bad" : "info"}>{n.stalled ? "止まっている可能性" : "実行中"}</Badge>
                        <span className="text-ink">{n.label}</span>
                      </div>
                      <p className="text-[11px] text-greige">
                        {n.who} ／ {hm(n.since)} から
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card eyebrow="NEXT" title="次の予定">
              {next ? (
                <div className="text-[12.5px]">
                  <p className="font-serif-jp text-[24px] leading-none tabular-nums text-ink">{next.time}</p>
                  <p className="mt-2 text-ink">{next.label}</p>
                  {next.agent && (
                    <p className="text-[11px] text-greige">
                      {next.agent.icon} {next.agent.name}（{next.agent.role}）
                    </p>
                  )}
                </div>
              ) : (
                <Empty>今日の予定はすべて終わりました。</Empty>
              )}
            </Card>
            <Card eyebrow="ATTENTION" title="確認が必要">
              {problems.length === 0 ? (
                <Empty>失敗・記録なしはありません。</Empty>
              ) : (
                <ul className="space-y-1.5">
                  {problems.map((s) => (
                    <li key={`${s.time}-${s.label}`} className="flex flex-wrap items-baseline gap-2 text-[12.5px]">
                      <Badge tone={STATE[s.state].tone}>{STATE[s.state].label}</Badge>
                      <span className="tabular-nums text-greige">{s.time}</span>
                      <span className="text-ink">{s.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card eyebrow="TODAY" title={`今日の時間割（${d.today}）`} aside="予定の時刻と、実際に動いた記録を突き合わせています">
            <ol className="relative space-y-0">
              {d.slots.map((s) => {
                const took = minutesBetween(s.run?.startedAt ?? null, s.run?.finishedAt ?? null);
                return (
                  <li
                    key={`${s.time}-${s.label}`}
                    className="grid grid-cols-[3.25rem_1fr] gap-3 border-b border-beige/60 py-2.5 last:border-b-0"
                  >
                    <span className="pt-0.5 text-[12.5px] tabular-nums text-greige">{s.time}</span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={STATE[s.state].tone}>{STATE[s.state].label}</Badge>
                        <span className={`rounded-sm px-1.5 py-0.5 text-[10.5px] ${TEAM_COLOR[s.team]}`}>{s.team}</span>
                        <span className="text-[13px] text-ink">{s.label}</span>
                        {s.agent && (
                          <span className="text-[11px] text-greige">
                            {s.agent.icon} {s.agent.name}
                          </span>
                        )}
                      </div>
                      {s.run && (
                        <p className="text-[11.5px] text-charcoal-light">
                          {hm(s.run.startedAt ?? s.run.finishedAt)} 開始
                          {took !== null && `・${took}分`}
                          {s.run.summary && s.run.status !== "running" && ` ／ ${s.run.summary}`}
                        </p>
                      )}
                      {s.state === "untracked" && (
                        <p className="text-[11px] text-greige">実行記録を残さないタスクです（結果はDiscordで届きます）</p>
                      )}
                      {s.state === "missing" && (
                        <p className="text-[11px] text-greige">
                          予定の時刻を過ぎても記録がありません。PCやClaudeアプリが止まっていた可能性があります
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            {d.extraRuns.length > 0 && (
              <div className="mt-4 border-t border-beige pt-3">
                <p className="mb-1 text-[11px] text-greige">予定外の実行（手動・やり直しなど）</p>
                <ul className="space-y-1">
                  {d.extraRuns.map((r) => (
                    <li key={r.id} className="text-[12px] text-charcoal-light">
                      <span className="tabular-nums text-greige">{hm(r.startedAt ?? r.finishedAt)}</span> {r.routine} ／{" "}
                      {STATE[r.status].label}
                      {r.summary && r.status !== "running" && ` ／ ${r.summary}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card eyebrow="TREE" title="実行ツリー">
              {d.trees.length === 0 ? (
                <Empty>今日の実行はまだありません。</Empty>
              ) : (
                <ul className="space-y-4">
                  {d.trees.map((t) => (
                    <Tree key={t.key} node={t} />
                  ))}
                </ul>
              )}
            </Card>

            <Card eyebrow="LOG" title="出来事（直近48時間）">
              {d.feed.length === 0 ? (
                <Empty>記録はまだありません。</Empty>
              ) : (
                <ul className="max-h-[560px] space-y-1.5 overflow-y-auto pr-1">
                  {d.feed.map((f) => (
                    <li key={f.key} className="grid grid-cols-[5.5rem_1fr] gap-2 text-[12px]">
                      <span className="tabular-nums text-greige">{mdhm(f.at)}</span>
                      <span className={f.tone === "bad" ? "text-[#8f3826]" : f.tone === "warn" ? "text-[#8a621a]" : "text-charcoal"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <ImprovementChanges data={improvements} />
        </>
      )}
    </div>
  );
}
