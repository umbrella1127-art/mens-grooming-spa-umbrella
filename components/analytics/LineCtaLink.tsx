"use client";

import { usePathname } from "next/navigation";
import { trackEvent, type CtaType } from "@/lib/analytics";

/**
 * サイト内すべての LINE CTA はこのコンポーネントを経由する。
 * 最重要KPI line_click を page / section / cta_type / menu / position 付きで送信。
 */
export default function LineCtaLink({
  href,
  ctaType,
  section,
  menu,
  position,
  className = "",
  children,
}: {
  href: string;
  ctaType: CtaType;
  section?: string;
  menu?: string;
  position?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() =>
        trackEvent("line_click", {
          page: pathname,
          section,
          cta_type: ctaType,
          menu,
          position,
        })
      }
    >
      {children}
    </a>
  );
}
