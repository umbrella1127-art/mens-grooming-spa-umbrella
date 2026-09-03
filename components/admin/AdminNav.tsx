"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "業務ボード" },
  { href: "/admin/settings", label: "サイト設定" },
  { href: "/admin/menus", label: "メニュー・料金" },
  { href: "/admin/faqs", label: "よくある質問" },
  { href: "/admin/posts", label: "ブログ" },
  { href: "/admin/images", label: "写真" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-1 gap-y-1">
      {TABS.map((tab) => {
        const active =
          tab.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-sm px-3 py-1.5 text-[12.5px] tracking-wide transition-colors ${
              active
                ? "bg-brown text-paper"
                : "text-greige hover:bg-charcoal-light hover:text-paper"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
