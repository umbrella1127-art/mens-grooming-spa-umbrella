import { Badge, Card, Empty } from "@/components/admin/board";
import type { Tone } from "@/lib/admin/board";
import { SCHEDULE } from "@/lib/admin/team";
import { getServerClient } from "@/lib/supabase/server";

interface Run {
  id: string;
  ran_at: string;
  routine: string;
  status: "ok" | "partial" | "error";
  summary: string | null;
  detail: string | null;
}

const STATUS_LABEL: Record<Run["status"], string> = {
  ok: "完了",
  partial: "一部のみ",
  error: "エラー",
};

const STATUS_TONE: Record<Run["status"], Tone> = {
  ok: "ok",
  partial: "warn",
  error: "bad",
};

function when(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function summarize(runs: Run[]) {
  const now = Date.now();
  const last30 = runs.filter(
    (r) => now - new Date(r.ran_at).getTime() <= 30 * 86_400_000,
  );
  return {
    last30,
    errors: last30.filter((r) => r.status === "error").length,
  };
}

export default async function ReportsPage() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .order("ran_at", { ascending: false })
    .limit(40);
  const runs = (data ?? []) as Run[];

  const { last30, errors } = summarize(runs);

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">REPORT</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          業務日報
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          自動実行がいつ動いて、何を出したかの記録です。{SCHEDULE.cron}に動きます。
        </p>
      </div>

      {error && (
        <div className="rounded-sm border border-beige border-l-[3px] border-l-[#a0731f] bg-[#f7f1e4] px-4 py-3 text-[13px] text-[#7a5716]">
          読み取れませんでした。Supabaseでマイグレーション 0024 を実行してください。
        </div>
      )}

      <Card
        eyebrow="RECENT"
        title="直近の稼働"
        aside={`直近30日 ${last30.length}回 ／ エラー ${errors}回`}
      >
        {runs.length === 0 ? (
          <Empty>
            まだ記録がありません。次回の自動実行（{SCHEDULE.cron}）から残りはじめます。
          </Empty>
        ) : (
          <ul className="divide-y divide-beige/60">
            {runs.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[12px] tabular-nums text-charcoal-light">
                    {when(r.ran_at)}
                  </span>
                  <Badge tone={STATUS_TONE[r.status]}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                  <span className="text-[11px] text-greige">{r.routine}</span>
                </div>
                {r.summary && (
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-charcoal">
                    {r.summary}
                  </p>
                )}
                {r.detail && (
                  <p className="mt-1 whitespace-pre-wrap text-[11.5px] leading-relaxed text-greige">
                    {r.detail}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
