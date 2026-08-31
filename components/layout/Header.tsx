"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LineCtaLink from "@/components/analytics/LineCtaLink";
import { NAV_ITEMS } from "@/components/layout/nav";

const PRIMARY_NAV = [
  { href: "/first-visit", label: "初めての方へ" },
  { href: "/menu", label: "メニュー・料金" },
  { href: "/menu/head-spa", label: "ヘッドスパ" },
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

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* backdrop-blur は fixed 子孫の包含ブロックを作ってしまうため、
          メニューのオーバーレイは header の外に置くこと */}
      <header className="sticky top-0 z-50 bg-ink/95 text-paper backdrop-blur">
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
            aria-label={open ? "メニューを閉じる" : "すべてのページを開く"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 text-beige transition-colors hover:text-paper"
          >
            <span className="hidden text-xs tracking-[0.25em] lg:block">
              {open ? "CLOSE" : "MENU"}
            </span>
            <span className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:h-auto lg:w-auto lg:gap-1">
              <span
                className={`block h-px w-6 bg-current transition-transform lg:w-5 ${
                  open ? "translate-y-[3.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-px w-6 bg-current transition-transform lg:w-5 ${
                  open ? "-translate-y-[3.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 top-16 z-40 overflow-y-auto bg-ink">
          <nav className="mx-auto grid max-w-6xl gap-x-8 gap-y-1 px-5 py-8 md:grid-cols-2 md:px-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
    </>
  );
}
