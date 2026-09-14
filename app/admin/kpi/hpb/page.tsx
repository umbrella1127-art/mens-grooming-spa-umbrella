import Link from "next/link";
import { Badge, Card, Empty } from "@/components/admin/board";
import { getHpbData } from "@/lib/admin/hpb";

const SEVERITY_TONE = {
  critical: "bad",
  warning: "warn",
  info: "info",
  good: "ok",
} as const;

const STATUS_LABEL: Record<string, string> = {
  proposed: "提案中",
  adopted: "採用",
  done: "実施済み",
  dropped: "見送り",
};

export default async function HpbPage() {
  const hpb = await getHpbData();

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">
          <Link href="/admin/kpi" className="hover:underline">
            KPI
          </Link>{" "}
          / HPB
        </p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          ホットペッパービューティー 分析
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          新規獲得を主軸に見る。運用ガイド: `scripts/hpb/GUIDE.md`
        </p>
      </div>

      {!hpb.available ? (
        <Card eyebrow="STATUS" title="準備中">
          <Empty>
            集客KPI基盤のテーブルが読み取れません。Supabaseでマイグレーション 0027 を実行してください。
          </Empty>
        </Card>
      ) : hpb.stores.length === 0 ? (
        <Card eyebrow="STATUS" title="準備中">
          <Empty>
            店舗が未登録です。`scripts/hpb/config.json` を設定して `python scripts/hpb/db_migrate.py`
            を実行してください。
          </Empty>
        </Card>
      ) : (
        <>
          <Card eyebrow="MONTHLY" title="月次推移(新規獲得・CPA)">
            {hpb.monthlyKpi.length === 0 ? (
              <Empty>
                まだ実績データがありません。Salon Report PDFを`data/hpb/&lt;store&gt;/inbox/`に入れて
                `/hpb-run`を実行してください。
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                      <th className="py-2 pr-3 font-semibold">月号</th>
                      <th className="py-2 pr-3 font-semibold">新規獲得数</th>
                      <th className="py-2 pr-3 font-semibold">CPA</th>
                      <th className="py-2 pr-3 font-semibold">CVR</th>
                      <th className="py-2 pr-3 font-semibold">新規リピート率</th>
                      <th className="py-2 pr-3 font-semibold">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hpb.monthlyKpi.map((r) => (
                      <tr
                        key={`${r.store}-${r.month}`}
                        className="border-b border-beige/60 last:border-b-0"
                      >
                        <td className="py-2.5 pr-3 align-top">
                          <Link
                            href={`/admin/kpi/hpb/${r.month}`}
                            className="text-brown underline underline-offset-4"
                          >
                            {r.month}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">
                          {r.customersNew ?? "—"}
                        </td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">
                          {r.cpaYen ? `¥${r.cpaYen.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">
                          {r.cvr ?? "—"}
                        </td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">
                          {r.newRepeatRate ?? "—"}
                        </td>
                        <td className="py-2.5 pr-3 align-top">
                          {r.dataStatus === "partial" ? (
                            <Badge tone="warn">締め前</Badge>
                          ) : (
                            <Badge tone="ok">確定</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card eyebrow="FINDINGS" title="所見(未確認)">
            {hpb.findings.length === 0 ? (
              <Empty>未確認の所見はありません。</Empty>
            ) : (
              <ul className="divide-y divide-beige/60">
                {hpb.findings.map((f) => (
                  <li key={f.id} className="py-2.5">
                    <div className="mb-1 flex flex-wrap items-baseline gap-2">
                      <Badge tone={SEVERITY_TONE[f.severity]}>{f.month}</Badge>
                      <span className="text-[12.5px] font-bold text-ink">
                        {f.title}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-charcoal-light">
                      {f.detail}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card eyebrow="STRATEGY" title="施策(提案中・採用中)">
            {hpb.strategies.length === 0 ? (
              <Empty>提案中・採用中の施策はありません。</Empty>
            ) : (
              <ul className="divide-y divide-beige/60">
                {hpb.strategies.map((s) => (
                  <li key={s.id} className="py-2.5">
                    <div className="mb-1 flex flex-wrap items-baseline gap-2">
                      <Badge tone={s.status === "adopted" ? "ok" : "info"}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </Badge>
                      <span className="text-[12.5px] font-bold text-ink">
                        {s.title}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-charcoal-light">
                      {s.rationale}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card eyebrow="REPORTS" title="月次レポート">
            {hpb.reports.length === 0 ? (
              <Empty>まだレポートが作成されていません。</Empty>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {hpb.reports.map((r) => (
                  <li key={`${r.store}-${r.month}`}>
                    <Link
                      href={`/admin/kpi/hpb/${r.month}`}
                      className="inline-block rounded-sm border border-beige px-3 py-1.5 text-[12.5px] text-charcoal hover:bg-paper-dark"
                    >
                      {r.month}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
