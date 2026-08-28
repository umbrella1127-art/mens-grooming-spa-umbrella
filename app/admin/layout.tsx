import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "管理画面｜MEN'S GROOMING SPA umbrella",
  robots: { index: false, follow: false },
};

const ADMIN_NAV = [
  { href: "/admin", label: "ホーム" },
  { href: "/admin/settings", label: "サイト設定" },
  { href: "/admin/menus", label: "メニュー・料金" },
  { href: "/admin/faqs", label: "よくある質問" },
  { href: "/admin/posts", label: "ブログ" },
  { href: "/admin/images", label: "写真" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
          <Link href="/admin" className="font-bold">
            umbrella 管理画面
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-neutral-600 hover:text-neutral-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <a
            href="/"
            target="_blank"
            className="ml-auto text-sm text-blue-600 hover:underline"
          >
            サイトを見る ↗
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
