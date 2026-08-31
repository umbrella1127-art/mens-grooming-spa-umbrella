import Link from "next/link";
import LineCtaLink from "@/components/analytics/LineCtaLink";
import { NAV_ITEMS } from "@/components/layout/nav";
import type { Settings } from "@/lib/types";

export default function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-serif-jp text-lg tracking-[0.15em]">
              MEN&apos;S GROOMING SPA
            </p>
            <p className="mb-4 text-xs tracking-[0.4em] text-beige">umbrella</p>
            <p className="text-sm text-greige">
              月に一度、自分を整える。
              <br />
              前橋の男性専用グルーミングサロン
            </p>
          </div>

          <div className="text-sm text-greige">
            <p className="mb-2 text-xs tracking-[0.25em] text-beige">
              INFORMATION
            </p>
            <p>{settings.address}</p>
            <p>{settings.parking}</p>
            <p className="mt-3">
              {settings.business_hours_weekday}
              <br />
              {settings.business_hours_weekend}
            </p>
            <p>{settings.closed_days}・完全予約制</p>
            <LineCtaLink
              href={settings.line_url}
              ctaType="line_footer"
              position="footer"
              className="mt-4 inline-block border-b border-greige pb-0.5 text-sm text-beige transition-colors hover:text-paper"
            >
              {settings.cta_primary_label}
            </LineCtaLink>
          </div>

          <nav className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-greige">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-paper"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-12 border-t border-charcoal pt-6 text-center text-[11px] text-greige">
          © {new Date().getFullYear()} MEN&apos;S GROOMING SPA umbrella
        </p>
      </div>
    </footer>
  );
}
