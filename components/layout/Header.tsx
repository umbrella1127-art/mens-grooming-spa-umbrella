"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LineCtaLink from "@/components/analytics/LineCtaLink";
import { NAV_ITEMS } from "@/components/layout/nav";

const PRIMARY_NAV = [
  { href: "/first-visit", label: "初めての方へ" },
  { href: "/menu/head-spa", label: "ヘッドスパ" },
  { href: "/menu/first-grooming", label: "初回グルーミング" },
  { href: "/about", label: "井上について" },
  { href: "/access", label: "ACCESS" },
];

export default function Header({
  lineUrl,
  ctaLabel,
}: {
  lineUrl: string;
  ctaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-ink/95 backdrop-blur text-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-serif-jp text-sm tracking-[0.18em] md:text-base">
            MEN&apos;S GROOMING SPA
          </span>
          <span className="text-[10px] tracking-[0.4em] text-beige">
            umbrella
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs tracking-wider text-beige transition-colors hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
          <LineCtaLink
            href={lineUrl}
            ctaType="line_header"
            position="header"
            className="rounded-sm border border-beige/60 px-4 py-2 text-xs tracking-wider text-paper transition-colors hover:bg-charcoal"
          >
            {ctaLabel}
          </LineCtaLink>
        </nav>

        <button
          type="button"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
        >
          <span
            className={`block h-px w-6 bg-paper transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`block h-px w-6 bg-paper transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </button>

        {/* デスクトップでは全ページ一覧をハンバーガーでも開けるようにする */}
        <button
          type="button"
          aria-label="全メニューを開く"
          onClick={() => setOpen(!open)}
          className="hidden text-xs tracking-[0.25em] text-beige transition-colors hover:text-paper lg:block"
        >
          MENU
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 top-16 z-40 overflow-y-auto bg-ink">
          <nav className="mx-auto grid max-w-6xl gap-1 px-5 py-8 md:grid-cols-2 md:px-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-charcoal py-4 font-serif-jp text-base tracking-wider text-paper transition-colors hover:text-beige"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-8 md:col-span-2">
              <LineCtaLink
                href={lineUrl}
                ctaType="line_header"
                position="menu_overlay"
                className="block rounded-sm bg-charcoal px-6 py-4 text-center text-sm tracking-wider text-paper transition-colors hover:bg-charcoal-light"
              >
                {ctaLabel}
              </LineCtaLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
