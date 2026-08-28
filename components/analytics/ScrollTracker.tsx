"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

const THRESHOLDS = [25, 50, 75, 90] as const;

/** ページごとのスクロール深度（25/50/75/90%）を各1回だけ送信 */
export default function ScrollTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const sent = new Set<number>();
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = (window.scrollY / scrollable) * 100;
      for (const t of THRESHOLDS) {
        if (percent >= t && !sent.has(t)) {
          sent.add(t);
          trackEvent("scroll_depth", { page: pathname, percent: t });
        }
      }
      if (sent.size === THRESHOLDS.length) {
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return null;
}
