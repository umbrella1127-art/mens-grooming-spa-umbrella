// 期間限定キャンペーンバナー（新規限定・2026年9月〜10月）。
// 通常価格→キャンペーン価格の一時的な訴求はMenu/price_statusの対象外のため、
// first-grooming.ts と同様にここを唯一の情報源とし、コード上の日付で自動終了させる。

export const CAMPAIGN_START = new Date("2026-09-01T00:00:00+09:00");
export const CAMPAIGN_END = new Date("2026-10-31T23:59:59+09:00");

/** 終了日時を過ぎたら自動的にバナーを非表示にする（ page.tsx は revalidate=3600 で定期再生成） */
export function isCampaignActive(now: Date = new Date()) {
  return now >= CAMPAIGN_START && now <= CAMPAIGN_END;
}

export const CAMPAIGN_BANNER = {
  periodLabel: "9月・10月限定",
  badgeLabel: "初めての方へ 新規限定",
  eyebrow: "30代からの身だしなみ",
  heading: "カット×シェービングで、\n清潔感のある大人の男へ。",
  body: "顔のテカリ、気になっていませんか。カット・シェービングに、毛穴とテカリをケアするフェイシャルをプラス。頭皮のニオイが気になる方には、炭酸クレンジングでのケアもお選びいただけます。",
  note: "肌のテカリ・毛穴ケア・頭皮ケアなど、お悩みに合わせてお選びいただけます。",
  menuLabel: "カット＋シェービング＋選べるフェイシャル",
  originalPrice: "¥9,900",
  campaignPrice: "¥8,800",
  duration: "施術目安 120分",
  audience: "男性限定・新規限定",
} as const;
