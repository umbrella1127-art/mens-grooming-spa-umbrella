import { Card, Empty } from "@/components/admin/board";
import { getGa4Data } from "@/lib/admin/ga4";

// GA4への外部fetchだけだと動的判定されずビルド時に固定化されてしまうため明示する
export const dynamic = "force-dynamic";

export default async function Ga4Page() {
  const ga4 = await getGa4Data(30);

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">GA4</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          アクセス解析
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          {ga4.available
            ? `${ga4.rangeStart} 〜 ${ga4.rangeEnd}（過去30日）`
            : "チャネル別セッション・ランディングページ・LINEクリック(line_click)の実績"}
        </p>
      </div>

      {!ga4.available ? (
        <Card eyebrow="STATUS" title="未接続">
          <Empty>
            {ga4.reason ?? "GA4に接続できませんでした。"}
            {" "}ローカルでは `npm run ga4:report` で同じデータを確認できます。
          </Empty>
        </Card>
      ) : (
        <>
          <Card eyebrow="CHANNEL" title="チャネル別セッション">
            {ga4.channels.length === 0 ? (
              <Empty>データがありません。</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                      <th className="py-2 pr-3 font-semibold">チャネル</th>
                      <th className="py-2 pr-3 font-semibold">セッション</th>
                      <th className="py-2 pr-3 font-semibold">ユーザー数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ga4.channels.map((c) => (
                      <tr key={c.channel} className="border-b border-beige/60 last:border-b-0">
                        <td className="py-2.5 pr-3 align-top">{c.channel}</td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">{c.sessions}</td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">{c.activeUsers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card eyebrow="LANDING" title="ランディングページ別セッション">
            {ga4.landingPages.length === 0 ? (
              <Empty>データがありません。</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                      <th className="py-2 pr-3 font-semibold">ページ</th>
                      <th className="py-2 pr-3 font-semibold">セッション</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ga4.landingPages.map((p) => (
                      <tr key={p.page} className="border-b border-beige/60 last:border-b-0">
                        <td className="py-2.5 pr-3 align-top">{p.page}</td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">{p.sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card eyebrow="LINE" title="line_click イベント発生ページ(最重要KPI)">
            {ga4.lineClicksByPage.length === 0 ? (
              <Empty>この期間、line_clickイベントは記録されていません。</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                      <th className="py-2 pr-3 font-semibold">ページ</th>
                      <th className="py-2 pr-3 font-semibold">クリック数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ga4.lineClicksByPage.map((p) => (
                      <tr key={p.page} className="border-b border-beige/60 last:border-b-0">
                        <td className="py-2.5 pr-3 align-top">{p.page}</td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">{p.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card eyebrow="CTA" title="line_click の cta_type 別内訳">
            {ga4.lineClicksByCtaType === null ? (
              <Empty>
                取得できませんでした。GA4管理画面の「カスタム定義」で`cta_type`をイベントパラメータとして登録すると表示されます。
              </Empty>
            ) : ga4.lineClicksByCtaType.length === 0 ? (
              <Empty>データがありません。</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                      <th className="py-2 pr-3 font-semibold">cta_type</th>
                      <th className="py-2 pr-3 font-semibold">クリック数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ga4.lineClicksByCtaType.map((c) => (
                      <tr key={c.ctaType} className="border-b border-beige/60 last:border-b-0">
                        <td className="py-2.5 pr-3 align-top">{c.ctaType}</td>
                        <td className="py-2.5 pr-3 align-top tabular-nums">{c.count}</td>
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
