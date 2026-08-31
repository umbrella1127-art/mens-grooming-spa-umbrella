import Link from "next/link";
import RevalidateButton from "@/components/admin/RevalidateButton";

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

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="mb-2 text-xl font-bold">管理画面</h1>
      <p className="mb-8 text-sm text-neutral-500">
        やりたいことを選んでください。保存すると数秒でサイトに反映されます。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className="rounded-lg border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <p className="mb-1 font-bold">{s.title}</p>
            <p className="text-sm text-neutral-500">{s.body}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <RevalidateButton />
      </div>
    </div>
  );
}
