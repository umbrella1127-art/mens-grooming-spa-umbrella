// 実行ごとの振り返り（4層）。①成果 ②やったこと＋自己診断 は時系列、③仕組み ④事業 の改善案は列を分けて出す。
import { resolveProposal } from "@/app/admin/actions/reflections";
import { Badge, Card, Empty } from "@/components/admin/board";
import {
  STATUS_LABEL,
  TARGET_LABEL,
  type Proposal,
  type ReflectionsData,
} from "@/lib/admin/reflections";

function jst(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3_600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

function ProposalItem({ p }: { p: Proposal }) {
  return (
    <li className="space-y-1.5 border-b border-beige/60 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>{TARGET_LABEL[p.target] ?? p.target}</Badge>
        {p.status === "reported" && <Badge tone="warn">{STATUS_LABEL.reported}</Badge>}
        <span className="text-[11px] text-greige">
          {jst(p.createdAt)} ／ {p.agent}
        </span>
      </div>
      <p className="text-[12.5px] text-ink">{p.proposal}</p>
      <p className="text-[11.5px] text-charcoal-light">理由: {p.reason}</p>
      {p.targetRef && <p className="break-all text-[11px] text-greige">{p.targetRef}</p>}
      <form action={resolveProposal} className="flex flex-wrap items-center gap-1.5 pt-1">
        <input type="hidden" name="id" value={p.id} />
        <input
          id={`proposal-note-${p.id}`}
          name="note"
          required
          maxLength={200}
          placeholder="ひとこと理由"
          aria-label="採用・見送りの理由"
          className="min-w-0 flex-1 rounded-sm border border-beige px-2 py-1 text-[12px]"
        />
        <button
          type="submit"
          name="status"
          value="accepted"
          className="rounded-sm bg-ink px-3 py-1 text-[11.5px] text-white"
        >
          採用
        </button>
        <button
          type="submit"
          name="status"
          value="rejected"
          className="rounded-sm border border-beige px-3 py-1 text-[11.5px] text-charcoal-light hover:bg-paper-dark"
        >
          見送り
        </button>
      </form>
    </li>
  );
}

export default function RunReflections({ data }: { data: ReflectionsData }) {
  if (!data.available) {
    return (
      <Card eyebrow="REFLECTION" title="振り返り">
        <Empty>振り返りの表が見つかりません。supabase/migrations/0032_run_reflections.sql を実行してください。</Empty>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card eyebrow="SYSTEM" title="仕組みの改善案（次回すぐ直す）" aside={`${data.system.length}件`}>
          <p className="mb-2 text-[11.5px] leading-relaxed text-greige">
            手順書・プログラム・ルールをどう直せば、次回もっと確実に回るか。点検担当が毎朝仕分けます。
          </p>
          {data.system.length === 0 ? (
            <Empty>未確認の案はありません。</Empty>
          ) : (
            <ul>
              {data.system.map((p) => (
                <ProposalItem key={p.id} p={p} />
              ))}
            </ul>
          )}
        </Card>
        <Card eyebrow="BUSINESS" title="事業の改善案（中長期で試す）" aside={`${data.business.length}件`}>
          <p className="mb-2 text-[11.5px] leading-relaxed text-greige">
            投稿の中身・時刻・見せ方をどう変えれば、お客さまが増えるか。知識整理・戦略担当が根拠と照らして仕分けます。
          </p>
          {data.business.length === 0 ? (
            <Empty>未確認の案はありません。</Empty>
          ) : (
            <ul>
              {data.business.map((p) => (
                <ProposalItem key={p.id} p={p} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card eyebrow="REFLECTION" title="実行ごとの振り返り（直近）">
        {data.reflections.length === 0 ? (
          <Empty>まだ振り返りはありません。次の定期実行から、各担当が作業の最後に書きます。</Empty>
        ) : (
          <ul>
            {data.reflections.map((r) => (
              <li key={r.id} className="space-y-1 border-b border-beige/60 py-3 last:border-b-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] tabular-nums text-greige">{jst(r.createdAt)}</span>
                  <span className="text-[12px] text-ink">{r.agent}</span>
                  <Badge tone={r.rulesOk ? "ok" : "bad"}>{r.rulesOk ? "ルールOK" : "ルール要確認"}</Badge>
                  <span className="text-[11px] text-greige">{r.runRef}</span>
                </div>
                <p className="text-[12.5px] text-ink">{r.output}</p>
                {r.urls.map((u) => (
                  <a key={u} href={u} className="block break-all text-[11.5px] text-brown underline">
                    {u}
                  </a>
                ))}
                <p className="text-[11.5px] text-charcoal-light">やったこと: {r.did}</p>
                <p className="text-[11.5px] text-charcoal-light">自己診断: {r.selfCheck}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
