import { saveGbpMonth } from "@/app/admin/actions/gbp";
import { Card, Empty } from "@/components/admin/board";
import { GBP_METRICS, getGbpData } from "@/lib/admin/gbp";

export default async function GbpPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const gbp = await getGbpData();
  const thisMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">GBP</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          Googleビジネスプロフィール
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          自動取得APIが無いため、GBPインサイト画面の数字を月に一度手入力しています。
        </p>
      </div>

      {saved === "1" && (
        <p className="rounded-sm border border-[#cfe0d3] bg-[#e6ede7] px-4 py-2.5 text-[12.5px] text-[#3d6a4c]">
          保存しました。
        </p>
      )}

      {!gbp.available ? (
        <Card eyebrow="STATUS" title="準備中">
          <Empty>
            集客KPI基盤のテーブルが読み取れません。Supabaseでマイグレーション 0027 を実行してください。
          </Empty>
        </Card>
      ) : !gbp.storeCode ? (
        <Card eyebrow="STATUS" title="準備中">
          <Empty>
            店舗が未登録です。`scripts/hpb/config.json` を設定して `python scripts/hpb/db_migrate.py`
            を実行してください。
          </Empty>
        </Card>
      ) : (
        <>
          <Card eyebrow="INPUT" title="月次実績の入力">
            <form action={saveGbpMonth} className="space-y-4">
              <input type="hidden" name="store" value={gbp.storeCode} />
              <div className="max-w-[160px]">
                <label className="mb-1 block text-[11.5px] text-greige" htmlFor="month">
                  月(YYYY-MM)
                </label>
                <input
                  id="month"
                  name="month"
                  type="month"
                  required
                  defaultValue={thisMonth}
                  className="w-full rounded-sm border border-beige px-2.5 py-1.5 text-[12.5px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {GBP_METRICS.map((m) => (
                  <div key={m.key}>
                    <label className="mb-1 block text-[11.5px] text-greige" htmlFor={m.key}>
                      {m.label}
                    </label>
                    <input
                      id={m.key}
                      name={m.key}
                      type="number"
                      min={0}
                      className="w-full rounded-sm border border-beige px-2.5 py-1.5 text-[12.5px]"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="rounded-sm bg-ink px-5 py-2 text-[12.5px] text-white"
              >
                保存
              </button>
            </form>
          </Card>

          <Card eyebrow="HISTORY" title="月次推移">
            {gbp.months.length === 0 ? (
              <Empty>まだ入力がありません。上のフォームから入力してください。</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                      <th className="py-2 pr-3 font-semibold">月</th>
                      {GBP_METRICS.map((m) => (
                        <th key={m.key} className="py-2 pr-3 font-semibold">
                          {m.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gbp.months.map((row) => (
                      <tr key={row.month} className="border-b border-beige/60 last:border-b-0">
                        <td className="py-2.5 pr-3 align-top">{row.month}</td>
                        {GBP_METRICS.map((m) => (
                          <td key={m.key} className="py-2.5 pr-3 align-top tabular-nums">
                            {row.values[m.key] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
