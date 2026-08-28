"use client";

import { sendGAEvent } from "@next/third-parties/google";

export type CtaType =
  | "line_fixed_bar"
  | "line_inline"
  | "line_hero"
  | "line_header"
  | "line_footer";

export interface EventParams {
  page?: string;
  section?: string;
  cta_type?: CtaType;
  menu?: string;
  position?: string;
  percent?: number;
}

/**
 * GA4 イベント送信ヘルパー。
 * 最重要KPIは line_click（LINEへの遷移）。全LINE CTAは LineCtaLink 経由で送信する。
 */
export function trackEvent(name: string, params: EventParams = {}) {
  if (!process.env.NEXT_PUBLIC_GA_ID) return;
  try {
    sendGAEvent("event", name, params as Record<string, unknown>);
  } catch {
    // 計測失敗で UI を壊さない
  }
}
