import LineCtaLink from "@/components/analytics/LineCtaLink";
import type { Settings } from "@/lib/types";

/**
 * スマホ下部の固定CTAバー。世界観を壊さない控えめなデザイン
 * （LINE緑はアイコンのみ、バー自体はブランドカラー）。
 */
export default function MobileLineBar({ settings }: { settings: Settings }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-charcoal bg-ink/95 backdrop-blur md:hidden">
      <LineCtaLink
        href={settings.line_url}
        ctaType="line_fixed_bar"
        position="mobile_bottom"
        className="flex items-center justify-center gap-2.5 py-3.5 text-sm tracking-wider text-paper"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-line-green"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 5.64 2 10.13c0 4.03 3.58 7.4 8.42 8.04.33.07.77.22.89.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1 .88.55 1.08-.46 5.83-3.43 7.95-5.88C21.5 13.44 22 11.86 22 10.13 22 5.64 17.52 2 12 2Z" />
        </svg>
        {settings.cta_primary_label}
      </LineCtaLink>
    </div>
  );
}
