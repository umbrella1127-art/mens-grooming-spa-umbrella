// /admin/kpi/threads の「アカウント全体」カード。日別の表示（棒）と投稿数、気づき、URL別リンククリック。
import { Badge, Card, Empty } from "@/components/admin/board";
import type { ThreadsAccountData } from "@/lib/admin/threads-account";

const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;

function Tile({ n, label, hint }: { n: string; label: string; hint?: string }) {
  return (
    <div className="rounded-sm border border-beige bg-white px-4 py-3">
      <div className="font-serif-jp text-[24px] leading-none tabular-nums text-ink">{n}</div>
      <div className="mt-2 text-[12px] tracking-wide text-charcoal">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-greige">{hint}</div>}
    </div>
  );
}

function ViewsBars({ days }: { days: ThreadsAccountData["days"] }) {
  const max = Math.max(1, ...days.map((d) => d.views));
  return (
    <figure>
      <div className="flex h-[140px] items-end gap-[2px] border-b border-beige" role="img" aria-label="日別の表示回数">
        {days.map((d) => {
          const tip = `${md(d.day)}　表示${d.views}・投稿${d.posts}本・いいね${d.likes}・返信${d.replies}`;
          return (
            // 棒より広い当たり判定（列全体）でツールチップを出す
            <div key={d.day} className="group relative flex h-full flex-1 items-end" title={tip}>
              <div
                className={`w-full rounded-t-[3px] ${d.posts === 0 ? "bg-beige" : "bg-brown"} group-hover:opacity-80`}
                style={{ height: `${d.views === 0 ? 0 : Math.max(2, (d.views / max) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* 投稿数の行。棒と同じ列幅 */}
      <div className="mt-1 flex gap-[2px] text-center text-[10px] tabular-nums">
        {days.map((d) => (
          <span key={d.day} className={`flex-1 ${d.posts === 0 ? "text-[#a8442e]" : "text-greige"}`}>
            {d.posts}
          </span>
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-[10.5px] tabular-nums text-greige">
        <span>{md(days[0].day)}</span>
        <span>{md(days[Math.floor(days.length / 2)].day)}</span>
        <span>{md(days[days.length - 1].day)}</span>
      </div>
      <figcaption className="mt-2 text-[11px] leading-relaxed text-greige">
        棒＝その日の表示回数（最大{max}回）。下の数字＝その日に出した投稿数（赤は0本、薄い棒は投稿0本の日）。
        1日の区切りは Threads の集計に合わせて日本時間の前日16時〜当日16時です。
      </figcaption>
    </figure>
  );
}

export default function ThreadsAccount({ d }: { d: ThreadsAccountData }) {
  if (!d.available) {
    return (
      <Card eyebrow="ACCOUNT" title="アカウント全体の推移">
        <Empty>テーブルが読み取れません。Supabaseでマイグレーション 0040 を実行してください。</Empty>
      </Card>
    );
  }
  if (d.days.length === 0) {
    return (
      <Card eyebrow="ACCOUNT" title="アカウント全体の推移">
        <Empty>まだ取り込まれていません。毎朝5:50に取り込みます。</Empty>
      </Card>
    );
  }
  const s = d.summary;
  const n = d.days.length;
  const diff = s.prevViews > 0 ? Math.round((s.views / s.prevViews - 1) * 100) : null;
  const fetched = d.fetchedAt
    ? new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(d.fetchedAt))
    : null;

  return (
    <Card
      eyebrow="ACCOUNT"
      title={`アカウント全体の推移（直近${n}日）`}
      aside={fetched ? `取り込み ${fetched}` : undefined}
    >
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Tile
          n={s.views.toLocaleString()}
          label="表示回数"
          hint={diff === null ? "前の期間は比較できる日数なし" : `前の${n}日比 ${diff >= 0 ? "+" : ""}${diff}%`}
        />
        <Tile n={s.posts ? Math.round(s.views / s.posts).toLocaleString() : "—"} label="1本あたりの表示" hint={`投稿${s.posts}本`} />
        <Tile n={`${s.postDays}/${n}`} label="投稿した日" hint={`${n - s.postDays}日は投稿0本`} />
        <Tile
          n={String(s.reactions)}
          label="反応（いいね・返信など）"
          hint={s.views ? `表示1,000回あたり${((s.reactions / s.views) * 1000).toFixed(1)}件` : undefined}
        />
        <Tile
          n={String(s.linkClicks)}
          label="リンクのクリック"
          hint={d.followers === null ? undefined : `フォロワー ${d.followers}人`}
        />
      </div>

      <div className="mt-5">
        <ViewsBars days={d.days} />
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-[12px] tracking-wide text-charcoal">気づきと改善案</h3>
        {d.insights.length === 0 ? (
          <Empty>今の数字から言えることはありません（件数がそろうと出ます）。</Empty>
        ) : (
          <ul className="space-y-3">
            {d.insights.map((i) => (
              <li key={i.title} className="rounded-sm border border-beige bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={i.tone}>{i.tone === "ok" ? "良い変化" : i.tone === "warn" ? "要対応" : "確認"}</Badge>
                  <span className="font-serif-jp text-[13.5px] text-ink">{i.title}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-charcoal-light">{i.evidence}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-charcoal">→ {i.suggestion}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-greige">
          気づきは数字から決まった型で出しています（lib/admin/threads-account.ts）。件数が少ない時期なので、言い切りではなく「次に確かめること」として読んでください。
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-[12px] tracking-wide text-charcoal">リンク別のクリック（直近{n}日）</h3>
          {d.links.length === 0 ? (
            <Empty>リンクのデータはまだありません。</Empty>
          ) : (
            <table className="w-full text-left text-[12px]">
              <tbody>
                {d.links.map((l) => (
                  <tr key={l.url} className="border-b border-beige/60 last:border-b-0">
                    <td className="break-all py-1.5 pr-3 text-charcoal">{l.url}</td>
                    <td className="py-1.5 text-right tabular-nums">{l.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <details className="text-[12px]">
          <summary className="mb-2 cursor-pointer tracking-wide text-charcoal">日別の表（数字で見る）</summary>
          <div className="max-h-[260px] overflow-y-auto">
            <table className="w-full text-left tabular-nums">
              <thead>
                <tr className="border-b border-beige text-[10.5px] text-greige">
                  <th className="py-1 pr-2 font-semibold">日</th>
                  <th className="py-1 pr-2 font-semibold">表示</th>
                  <th className="py-1 pr-2 font-semibold">投稿</th>
                  <th className="py-1 pr-2 font-semibold">いいね</th>
                  <th className="py-1 pr-2 font-semibold">返信</th>
                  <th className="py-1 font-semibold">再投稿・引用</th>
                </tr>
              </thead>
              <tbody>
                {[...d.days].reverse().map((x) => (
                  <tr key={x.day} className="border-b border-beige/60 last:border-b-0">
                    <td className="py-1 pr-2">{md(x.day)}</td>
                    <td className="py-1 pr-2">{x.views}</td>
                    <td className="py-1 pr-2">{x.posts}</td>
                    <td className="py-1 pr-2">{x.likes}</td>
                    <td className="py-1 pr-2">{x.replies}</td>
                    <td className="py-1">{x.reposts + x.quotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </Card>
  );
}
