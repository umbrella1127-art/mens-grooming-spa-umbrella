import Link from "next/link";
import { Badge, Card, Empty } from "@/components/admin/board";
import { getHpbData } from "@/lib/admin/hpb";

const SEVERITY_TONE = {
  critical: "bad",
  warning: "warn",
  info: "info",
  good: "ok",
} as const;

export default async function KpiPage() {
  const hpb = await getHpbData();
  const latestByStore = new Map<string, (typeof hpb.monthlyKpi)[number]>();
  for (const row of hpb.monthlyKpi) {
    if (!latestByStore.has(row.store)) latestByStore.set(row.store, row);
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">KPI</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          集客KPIハブ
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          最重要KPIはLINEクリック(line_click)。数値目標は未設定です。あわせてHPB(ホットペッパービューティー)の新規獲得実績もここから確認できます。
        </p>
      </div>

      <Card eyebrow="LINE" title="LINE誘導(GA4)">
        <Empty>
          月間目標などの数値はまだ決まっていません。実績は<Link href="/admin/ga4" className="text-brown underline underline-offset-4">GA4タブ</Link>を参照してください。
        </Empty>
      </Card>

      <Card
        eyebrow="HPB"
        title="ホットペッパービューティー 新規獲得"
        aside={
          <Link href="/admin/kpi/hpb" className="underline underline-offset-4">
            詳細を見る →
          </Link>
        }
      >
        {!hpb.available ? (
          <Empty>
            集客KPI基盤のテーブルが読み取れません。Supabaseでマイグレーション 0027 を実行してください。
          </Empty>
        ) : hpb.stores.length === 0 ? (
          <Empty>
            店舗が未登録です。`scripts/hpb/config.json` を設定して `python scripts/hpb/db_migrate.py`
            を実行してください(詳細は `scripts/hpb/GUIDE.md`)。
          </Empty>
        ) : latestByStore.size === 0 ? (
          <Empty>
            まだ実績データがありません。Salon Report PDFを取り込むと(`/hpb-run`)ここに表示されます。
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                  <th className="py-2 pr-3 font-semibold">店舗</th>
                  <th className="py-2 pr-3 font-semibold">月号</th>
                  <th className="py-2 pr-3 font-semibold">新規獲得数</th>
                  <th className="py-2 pr-3 font-semibold">新規獲得単価(CPA)</th>
                </tr>
              </thead>
              <tbody>
                {hpb.stores.map((s) => {
                  const row = latestByStore.get(s.code);
                  return (
                    <tr key={s.code} className="border-b border-beige/60 last:border-b-0">
                      <td className="py-2.5 pr-3 align-top">{s.name}</td>
                      <td className="py-2.5 pr-3 align-top tabular-nums">
                        {row?.month ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 align-top tabular-nums">
                        {row?.customersNew ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 align-top tabular-nums">
                        {row?.cpaYen ? `¥${row.cpaYen.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {hpb.available && hpb.findings.length > 0 && (
        <Card eyebrow="FINDINGS" title="未確認の所見">
          <ul className="space-y-2">
            {hpb.findings.slice(0, 5).map((f) => (
              <li key={f.id} className="flex flex-wrap items-baseline gap-2">
                <Badge tone={SEVERITY_TONE[f.severity]}>{f.month}</Badge>
                <span className="text-[12.5px] text-charcoal">{f.title}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
