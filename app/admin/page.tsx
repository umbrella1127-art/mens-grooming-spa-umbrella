import Link from "next/link";
import RevalidateButton from "@/components/admin/RevalidateButton";
import { Alerts, Badge, Card, Empty, Flow } from "@/components/admin/board";
import {
  CHANNEL_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  getBoardData,
} from "@/lib/admin/board";

const SHORTCUTS = [
  {
    href: "/admin/settings",
    title: "キャッチコピー・CTAを変える",
    body: "トップの文言、LINEボタンの文言、LINEのURLなど",
  },
  {
    href: "/admin/menus",
    title: "メニュー・料金を編集",
    body: "価格の変更、「価格未定」の切り替え、公開/非公開",
  },
  {
    href: "/admin/images",
    title: "写真を差し替える",
    body: "トップの写真、各ページの写真",
  },
  {
    href: "/admin/posts",
    title: "ブログを書く",
    body: "記事の作成・編集・公開",
  },
  {
    href: "/admin/faqs",
    title: "よくある質問を編集",
    body: "質問の追加・修正・並び替え",
  },
  {
    href: "/admin/settings#hours",
    title: "営業時間・定休日を変える",
    body: "営業時間、定休日、アクセス情報",
  },
];

export default async function AdminBoardPage() {
  const board = await getBoardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[17px] font-bold">
          業務ボード
          <span className="ml-2 text-[12.5px] font-normal text-neutral-500">
            {board.today} 時点。コンテンツがどこまで進んで、どこで止まっているか
          </span>
        </h1>
      </div>

      <Alerts alerts={board.alerts} />

      <Flow stages={board.stages} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="🖐 承認待ちの下書き" aside="Discordで承認・修正・却下">
          {board.pendingDrafts.length === 0 ? (
            <Empty>
              {board.draftsAvailable
                ? "承認待ちはありません。"
                : "下書きを読み取れませんでした。"}
            </Empty>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {board.pendingDrafts.map((d) => (
                <li key={d.id} className="flex gap-3 py-2.5">
                  <div className="pt-0.5">
                    <Badge>{CHANNEL_LABEL[d.channel]}</Badge>
                  </div>
                  <p className="flex-1 text-[12.5px] leading-relaxed text-neutral-700">
                    {d.text}
                  </p>
                  <span className="shrink-0 text-[11px] tabular-nums text-neutral-400">
                    {d.days}日
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="📝 ブログの下書き" aside="入稿待ち">
          {board.draftPosts.length === 0 ? (
            <Empty>書きかけの記事はありません。</Empty>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {board.draftPosts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <Link
                    href={`/admin/posts/${p.id}`}
                    className="flex-1 text-[12.5px] text-neutral-700 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <span className="shrink-0 text-[11px] tabular-nums text-neutral-400">
                    {p.days}日
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="🕒 直近の下書き"
        aside={board.activity.map((a) => `${a.label} ${a.value}`).join(" ／ ")}
      >
        {board.recentDrafts.length === 0 ? (
          <Empty>
            {board.draftsAvailable
              ? "まだ下書きが届いていません。週3回（月・水・金 朝9時）のスケジュール実行で追加されます。"
              : "下書きを読み取れませんでした。"}
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-neutral-200 text-[10.5px] uppercase tracking-wide text-neutral-400">
                  <th className="py-2 pr-3 font-semibold">種別</th>
                  <th className="py-2 pr-3 font-semibold">状態</th>
                  <th className="py-2 pr-3 font-semibold">内容</th>
                  <th className="py-2 font-semibold whitespace-nowrap">受信</th>
                </tr>
              </thead>
              <tbody>
                {board.recentDrafts.map((d) => (
                  <tr key={d.id} className="border-b border-neutral-100 last:border-b-0">
                    <td className="py-2.5 pr-3 align-top">
                      <Badge>{CHANNEL_LABEL[d.channel]}</Badge>
                    </td>
                    <td className="py-2.5 pr-3 align-top">
                      <Badge tone={STATUS_TONE[d.status]}>
                        {STATUS_LABEL[d.status]}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 align-top leading-relaxed text-neutral-700">
                      {d.text}
                    </td>
                    <td className="py-2.5 align-top whitespace-nowrap tabular-nums text-neutral-400">
                      {d.at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="🛠 やりたいことから探す">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="rounded-[14px] border border-neutral-200 p-4 transition-colors hover:bg-neutral-50"
            >
              <p className="mb-1 text-[12.5px] font-bold">{s.title}</p>
              <p className="text-[11.5px] leading-relaxed text-neutral-500">
                {s.body}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <RevalidateButton />
        </div>
      </Card>
    </div>
  );
}
