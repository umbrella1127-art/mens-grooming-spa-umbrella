// 自律改善（スライドS09）の承認と経過。承認待ちは差分を見て「承認」「却下」、反映後は7日後の効果確認の結果を出す。
import { decideImprovement } from "@/app/admin/actions/improvements";
import { Badge, Card, Empty } from "@/components/admin/board";
import type { Tone } from "@/lib/admin/board";
import { CHANGE_STATUS_LABEL, type ChangeStatus, type ImprovementChange } from "@/lib/admin/improvements";

const TONE: Record<ChangeStatus, Tone> = {
  drafted: "info",
  awaiting_approval: "warn",
  approved: "info",
  applied: "info",
  kept: "ok",
  reverted: "warn",
  rejected: "info",
  stale: "warn",
  failed: "bad",
};

const GATE_LABEL = { auto: "自動でよい範囲", approval: "承認が必要な範囲", forbidden: "禁止" } as const;

function DiffView({ diff }: { diff: string }) {
  return (
    <div className="max-h-[320px] overflow-auto rounded-sm border border-beige bg-white">
      <pre className="p-3 text-[11px] leading-relaxed">
        {diff.split("\n").map((line, i) => (
          <span
            key={i}
            className={`block whitespace-pre ${
              line.startsWith("+") && !line.startsWith("+++")
                ? "bg-[#e6ede7] text-[#2f5a3c]"
                : line.startsWith("-") && !line.startsWith("---")
                  ? "bg-[#f3ddd7] text-[#7a3020]"
                  : "text-charcoal-light"
            }`}
          >
            {line || " "}
          </span>
        ))}
      </pre>
    </div>
  );
}

function ChangeItem({ c }: { c: ImprovementChange }) {
  const waiting = c.status === "awaiting_approval";
  return (
    <li className="space-y-2 border-b border-beige/60 py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] tabular-nums text-greige">#{c.id}</span>
        <Badge tone={TONE[c.status]}>{CHANGE_STATUS_LABEL[c.status]}</Badge>
        <Badge>{GATE_LABEL[c.gate]}</Badge>
        <span className="text-[13px] text-ink">{c.summary}</span>
      </div>
      <dl className="grid gap-x-4 gap-y-1 text-[12px] text-charcoal-light sm:grid-cols-[auto_1fr]">
        {c.proposal && (
          <>
            <dt className="text-greige">もとの改善案</dt>
            <dd>{c.proposal}</dd>
          </>
        )}
        <dt className="text-greige">対象</dt>
        <dd className="break-all">{c.files.join("、")}</dd>
        <dt className="text-greige">効果の測り方</dt>
        <dd>
          {c.watch}
          {c.status === "applied" && c.verifyAfter && ` ／ ${c.verifyAfter} に確認`}
        </dd>
        {c.note && (
          <>
            <dt className="text-greige">メモ</dt>
            <dd>{c.note}</dd>
          </>
        )}
      </dl>
      <details open={waiting}>
        <summary className="cursor-pointer text-[11.5px] text-greige">差分と安全ゲートの判定を見る</summary>
        <div className="mt-2 space-y-2">
          <ul className="text-[11.5px] text-charcoal-light">
            {c.gateReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <DiffView diff={c.diff} />
        </div>
      </details>
      {waiting && (
        <form action={decideImprovement} className="flex flex-wrap items-center gap-2 pt-1">
          <input type="hidden" name="id" value={c.id} />
          <input
            id={`improve-note-${c.id}`}
            name="note"
            maxLength={200}
            placeholder="却下の理由（承認なら空でよい）"
            aria-label="承認・却下のメモ"
            className="min-w-0 flex-1 rounded-sm border border-beige px-2 py-1.5 text-[12px]"
          />
          <button type="submit" name="decision" value="approved" className="rounded-sm bg-ink px-4 py-1.5 text-[12px] text-white">
            承認して反映
          </button>
          <button
            type="submit"
            name="decision"
            value="rejected"
            className="rounded-sm border border-beige px-4 py-1.5 text-[12px] text-charcoal-light hover:bg-paper-dark"
          >
            却下
          </button>
        </form>
      )}
    </li>
  );
}

export default function ImprovementChanges({
  data,
}: {
  data: { available: boolean; changes: ImprovementChange[] };
}) {
  const waiting = data.changes.filter((c) => c.status === "awaiting_approval").length;
  return (
    <div id="improve">
      <Card eyebrow="SELF-IMPROVE" title="仕組みの修正（自律改善）" aside={waiting ? `承認待ち ${waiting}件` : undefined}>
        <p className="mb-2 text-[11.5px] leading-relaxed text-greige">
          修繕担当が、振り返りで出た「仕組みの改善案」から直し案を作ります。今はすべてあなたの承認で反映します
          （承認すると、次の定期実行＝毎朝5:00か見張りのあとに反映）。反映の7日後に効果を確かめ、
          良くなっていなければ自動で元に戻します。公開サイト・DB・絶対ルールは、安全ゲートが最初から受け付けません。
        </p>
        {!data.available ? (
          <Empty>自律改善の表が見つかりません。supabase/migrations/0036_auto_improve.sql を実行してください。</Empty>
        ) : data.changes.length === 0 ? (
          <Empty>まだ直し案はありません。改善案がたまると、毎朝5:00に修繕担当が作ります。</Empty>
        ) : (
          <ul>
            {data.changes.map((c) => (
              <ChangeItem key={c.id} c={c} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
