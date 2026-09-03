"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "📋 業務ボード" },
  { href: "/admin/settings", label: "⚙️ サイト設定" },
  { href: "/admin/menus", label: "💴 メニュー・料金" },
  { href: "/admin/faqs", label: "❓ よくある質問" },
  { href: "/admin/posts", label: "📝 ブログ" },
  { href: "/admin/images", label: "🖼 写真" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1.5">
      {TABS.map((tab) => {
        const active =
          tab.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
              active
                ? "bg-[#5b6cff] text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
