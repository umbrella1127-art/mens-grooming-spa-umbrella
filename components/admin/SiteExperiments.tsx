// /admin/ga4 の「サイト改善の実験」。サイトを変えたら登録 → 毎朝の判定結果を見て採用か元に戻すかを選ぶ。
import { createExperiment, decideExperiment } from "@/app/admin/actions/experiments";
import { Badge, Card, Empty } from "@/components/admin/board";
import type { Tone } from "@/lib/admin/board";
import {
  DECISION_LABEL,
  KPI_OPTIONS,
  SITE_PAGES,
  VERDICT_LABEL,
  type Experiment,
  type SiteExperiments as Data,
} from "@/lib/admin/experiments";

const VERDICT_TONE: Record<NonNullable<Experiment["verdict"]>, Tone> = {
  win: "ok",
  lose: "bad",
  flat: "info",
  insufficient: "warn",
};

const inputClass = "w-full rounded-sm border border-beige px-2.5 py-1.5 text-[12.5px]";
const labelClass = "mb-1 block text-[11.5px] text-greige";

function kpiLabel(kpi: Experiment["kpi"]) {
  return KPI_OPTIONS.find((k) => k.value === kpi)?.label.replace("（最重要）", "") ?? kpi;
}

function pageLabel(page: string) {
  return page === "(all)" ? "サイト全体" : page;
}

function todayJst() {
  return new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
}

function ExperimentRow({ e }: { e: Experiment }) {
  const measuring = e.verdict === null;
  return (
    <li className="space-y-2 border-b border-beige/60 py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] tabular-nums text-greige">{e.code}</span>
        {measuring ? (
          <Badge tone="info">測定中（{e.endDay} まで）</Badge>
        ) : (
          <Badge tone={VERDICT_TONE[e.verdict!]}>{VERDICT_LABEL[e.verdict!]}</Badge>
        )}
        {e.decision !== "pending" && <Badge>{DECISION_LABEL[e.decision]}</Badge>}
      </div>
      <p className="text-[13px] text-ink">{e.whatChanged}</p>
      <dl className="grid gap-x-4 gap-y-1 text-[12px] text-charcoal-light sm:grid-cols-[auto_1fr]">
        <dt className="text-greige">ページ・指標</dt>
        <dd>
          {pageLabel(e.targetPage)} ／ {kpiLabel(e.kpi)} ／ {e.startDay} に変更・{e.measureDays}日間で比較
        </dd>
        <dt className="text-greige">なぜ</dt>
        <dd>{e.hypothesis}</dd>
        <dt className="text-greige">予想</dt>
        <dd>{e.expected}</dd>
        {e.resultSummary && (
          <>
            <dt className="text-greige">結果</dt>
            <dd className="text-ink">{e.resultSummary}</dd>
          </>
        )}
        {measuring && e.before && (
          <>
            <dt className="text-greige">途中経過</dt>
            <dd>数が少なかったため、測る期間を{e.measureDays}日に延ばしました</dd>
          </>
        )}
      </dl>
      {!measuring && e.decision === "pending" && (
        <div className="flex flex-wrap gap-2 pt-1">
          <form action={decideExperiment}>
            <input type="hidden" name="id" value={e.id} />
            <input type="hidden" name="decision" value="adopted" />
            <button type="submit" className="rounded-sm bg-ink px-4 py-1.5 text-[12px] text-white">
              このまま採用
            </button>
          </form>
          <form action={decideExperiment}>
            <input type="hidden" name="id" value={e.id} />
            <input type="hidden" name="decision" value="rolled_back" />
            <button
              type="submit"
              className="rounded-sm border border-beige px-4 py-1.5 text-[12px] text-charcoal-light hover:bg-paper-dark"
            >
              元に戻した
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

export default function SiteExperiments({ data, saved }: { data: Data; saved: boolean }) {
  const measuring = data.experiments.filter((e) => e.verdict === null);
  const judged = data.experiments.filter((e) => e.verdict !== null);

  return (
    <div id="experiments" className="space-y-6">
      <Card
        eyebrow="EXPERIMENT"
        title="サイト改善の実験"
        aside={data.dataThrough ? `GA4の日次データ: ${data.dataThrough} まで` : "GA4の日次データ: まだありません"}
      >
        <div className="space-y-5">
          <p className="text-[12.5px] leading-relaxed text-charcoal-light">
            サイトの文言・写真・ボタンを変えたら、ここに登録してください。変えた日の前後で同じ日数を比べ、
            期間が終わった翌朝に自動で判定してDiscordに知らせます。数が少なすぎるときは勝ち負けを付けず、
            期間を延ばして待ちます（最長28日）。採用するか元に戻すかは、結果を見てあなたが選びます。
          </p>

          {saved && (
            <p className="rounded-sm bg-[#e6ede7] px-3 py-2 text-[12.5px] text-[#3d6a4c]">
              登録しました。期間が終わった翌朝に判定されます。
            </p>
          )}

          {!data.available ? (
            <Empty>実験の表が見つかりません。supabase/migrations/0031_site_experiments.sql を実行してください。</Empty>
          ) : (
            <form action={createExperiment} className="space-y-4 rounded-sm border border-beige/70 bg-paper-dark/40 p-4">
              <div>
                <label className={labelClass} htmlFor="exp-what">何を変えた？</label>
                <input
                  id="exp-what"
                  name="what_changed"
                  required
                  maxLength={200}
                  placeholder="例: トップのLINEボタンの文言を「空き状況を聞いてみる」に変えた"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="exp-why">なぜ？（ねらい）</label>
                <input
                  id="exp-why"
                  name="hypothesis"
                  required
                  maxLength={300}
                  placeholder="例: 「予約」より気軽に押せる言葉のほうが、初めての人が押しやすいはず"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="exp-expected">どうなるはず？</label>
                <input
                  id="exp-expected"
                  name="expected"
                  required
                  maxLength={200}
                  placeholder="例: トップのLINEクリック率が上がる"
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className={labelClass} htmlFor="exp-page">ページ</label>
                  <input
                    id="exp-page"
                    name="target_page"
                    required
                    list="exp-pages"
                    defaultValue="/"
                    className={inputClass}
                  />
                  <datalist id="exp-pages">
                    {SITE_PAGES.map((p) => (
                      <option key={p} value={p}>
                        {pageLabel(p)}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={labelClass} htmlFor="exp-kpi">何で測る？</label>
                  <select id="exp-kpi" name="kpi" defaultValue="line_click" className={inputClass}>
                    {KPI_OPTIONS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="exp-start">変えた日</label>
                  <input
                    id="exp-start"
                    name="start_day"
                    type="date"
                    required
                    defaultValue={todayJst()}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="exp-days">比べる日数</label>
                  <select id="exp-days" name="measure_days" defaultValue="14" className={inputClass}>
                    <option value="7">7日</option>
                    <option value="14">14日</option>
                    <option value="28">28日</option>
                  </select>
                </div>
              </div>
              <p className="text-[11.5px] text-greige">
                1回に変えるのは1か所だけにすると、何が効いたか分かります。
                サイト全体の変更はページに「(all)」を入れてください。
              </p>
              <button type="submit" className="rounded-sm bg-ink px-5 py-2 text-[12.5px] text-white">
                実験として登録
              </button>
            </form>
          )}
        </div>
      </Card>

      {data.available && (
        <Card eyebrow="RESULTS" title="実験の記録" aside={`測定中 ${measuring.length}件 ／ 判定済み ${judged.length}件`}>
          {data.experiments.length === 0 ? (
            <Empty>まだ実験はありません。サイトを変えたら、上のフォームから登録してください。</Empty>
          ) : (
            <ul>
              {[...measuring, ...judged].map((e) => (
                <ExperimentRow key={e.id} e={e} />
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
