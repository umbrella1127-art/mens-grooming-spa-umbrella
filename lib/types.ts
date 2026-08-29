export type PriceStatus = "fixed" | "tbd" | "hidden";

export type MenuCategory =
  | "first_grooming"
  | "head_spa"
  | "head_spa_solo"
  | "facial"
  | "shaving"
  | "hair_growth"
  | "inner_beauty"
  | "slimming"
  | "mimitsubo"
  | "gift"
  | "membership"
  | "option";

export interface Menu {
  id: string;
  slug: string;
  name: string;
  category: MenuCategory;
  description: string | null;
  duration_min: number | null;
  price_yen: number | null;
  price_status: PriceStatus;
  price_note: string | null;
  is_published: boolean;
  is_recommended: boolean;
  sort_order: number;
  page_slug: string | null;
  image_url: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_markdown: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  source: "manual" | "ai";
  created_at: string;
  updated_at: string;
}

export interface ImageSlot {
  slot_key: string;
  url: string;
  alt: string;
  label: string;
  width: number | null;
  height: number | null;
}

export interface SettingRow {
  key: string;
  value: { text?: string } & Record<string, unknown>;
  label: string;
  group_name: string;
  input_type: string;
  sort_order: number;
}

/** site_settings をキー→文字列に落としたもの */
export type Settings = Record<string, string>;
