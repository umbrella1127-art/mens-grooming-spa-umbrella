// Supabase 未設定（環境変数なし）でもサイトが表示できるようにするための
// フォールバックデータ。内容は supabase/seed.sql と対応させること。
// Supabase 接続後はこのファイルは使われない。

import type { Faq, ImageSlot, Menu, Post, Settings } from "./types";

export const fallbackSettings: Settings = {
  fv_copy_main:
    "疲れが抜けない。\n髪が少し細くなった気がする。\n肌の印象も、変わってきた。",
  fv_copy_sub:
    "35歳を過ぎた男性のための、髪・頭皮・肌・身体をまとめて相談できる男性専用サロン。",
  cta_primary_label: "LINEで相談・予約",
  cta_sub_label: "予約前のご相談だけでも大丈夫です。",
  line_url: "https://lin.ee/PLACEHOLDER",
  business_hours_weekday: "12:00〜21:00",
  business_hours_weekend: "10:00〜19:00",
  closed_days: "不定休",
  hours_note: "時間外をご希望の場合はLINEでご相談ください。",
  shop_name: "MEN'S GROOMING SPA umbrella",
  address: "群馬県前橋市小相木町388-1",
  parking: "駐車場19台（無料）",
  access_note:
    "お車でのご来店が便利です。前橋市内はもちろん、高崎・伊勢崎方面からもお越しいただけます。",
  gift_lead_text: "大切な人に、「月に一度、自分を整える時間」を贈る。",
  gift_note: "内容・料金はLINEでご案内しています。お気軽にご相談ください。",
};

const m = (row: Partial<Menu> & Pick<Menu, "slug" | "name" | "category">): Menu => ({
  id: row.slug!,
  description: null,
  duration_min: null,
  price_yen: null,
  price_status: "tbd",
  price_note: null,
  is_published: true,
  is_recommended: false,
  sort_order: 0,
  page_slug: null,
  image_url: null,
  ...row,
});

export const fallbackMenus: Menu[] = [
  m({
    slug: "headspa-tsuki",
    name: "月（つき）",
    category: "head_spa",
    description:
      "カット＋シェービング＋ヘッドスパ35分。月に一度の身だしなみとリセットを、一度にまとめて。",
    duration_min: 90,
    price_yen: 9900,
    price_status: "fixed",
    price_note: "税込",
    sort_order: 1,
    page_slug: "head-spa",
  }),
  m({
    slug: "headspa-jo",
    name: "浄（じょう）",
    category: "head_spa",
    description:
      "カット＋シェービング＋ヘッドスパ50分。頭浸浴と専用オイルを使い、たっぷりのマッサージで深く整える上位コース。",
    duration_min: 120,
    price_yen: 12870,
    price_status: "fixed",
    price_note: "税込",
    is_recommended: true,
    sort_order: 2,
    page_slug: "head-spa",
  }),
  m({
    slug: "headspa-solo-tsuki",
    name: "ヘッドスパ単品（月）",
    category: "head_spa_solo",
    description:
      "カット・シェービングなしで、「月」のヘッドスパだけをご利用いただけます。予約枠の目安は60分です。",
    duration_min: 60,
    price_yen: 8800,
    price_status: "fixed",
    price_note: "税込・カット不要",
    sort_order: 1,
    page_slug: "head-spa",
  }),
  m({
    slug: "headspa-solo-jo",
    name: "ヘッドスパ単品（浄）",
    category: "head_spa_solo",
    description:
      "カット・シェービングなしで、「浄」のヘッドスパだけをご利用いただけます。",
    price_yen: 11550,
    price_status: "fixed",
    price_note: "税込・カット不要",
    sort_order: 2,
    page_slug: "head-spa",
  }),
  m({
    slug: "headspa-facial-tsuki",
    name: "ヘッドスパ（月）＋フェイシャル",
    category: "head_spa_solo",
    description:
      "カット・シェービングなしで、「月」のヘッドスパとフェイシャルを組み合わせたコースです。忙しい日でも、頭と肌をまとめて整えられます。",
    price_yen: 11000,
    price_status: "fixed",
    price_note: "〜・税込・カット不要",
    sort_order: 3,
    page_slug: "head-spa",
  }),
  m({
    slug: "headspa-facial-jo",
    name: "ヘッドスパ（浄）＋フェイシャル",
    category: "head_spa_solo",
    description:
      "カット・シェービングなしで、「浄」のヘッドスパとフェイシャルを組み合わせたコースです。忙しい日でも、頭と肌をまとめて整えられます。",
    price_yen: 13750,
    price_status: "fixed",
    price_note: "〜・税込・カット不要",
    sort_order: 4,
    page_slug: "head-spa",
  }),
  m({
    slug: "first-ume",
    name: "初回グルーミング【梅】",
    category: "first_grooming",
    description:
      "カット＋シェービング＋ヘッドスパ「月」35分。月1回の身だしなみを一通り整えるコース。",
    duration_min: 120,
    price_yen: 9900,
    price_status: "fixed",
    price_note: "税込",
    sort_order: 1,
    page_slug: "first-grooming",
  }),
  m({
    slug: "first-take",
    name: "初回グルーミング【竹】",
    category: "first_grooming",
    description:
      "カット＋シェービング＋ヘッドスパ「浄」50分。溜まった疲れをリセットして、また明日から頑張れる感覚へ。",
    duration_min: 150,
    is_recommended: true,
    sort_order: 2,
    page_slug: "first-grooming",
  }),
  m({
    slug: "first-matsu",
    name: "初回グルーミング【松】",
    category: "first_grooming",
    description:
      "竹の内容＋フェイシャル＋肌の水分・油分チェック。疲れをリセットし、肌まで整えて、自分に少し自信を持って帰る。",
    duration_min: 180,
    sort_order: 3,
    page_slug: "first-grooming",
  }),
  m({
    slug: "facial",
    name: "グルーミングフェイシャル",
    category: "facial",
    description:
      "肌の水分・油分を測定してから、オイルのハンドマッサージと美容機器で肌を整えるフェイシャルケア。",
    duration_min: 60,
    sort_order: 1,
    page_slug: "facial",
  }),
  m({
    slug: "shaving",
    name: "シェービング",
    category: "shaving",
    description:
      "単なるヒゲ剃りではなく、男性の身だしなみを整えるグルーミングとしてのシェービング。各コースに含まれます。",
    price_status: "hidden",
    price_note: "コースに含まれます",
    sort_order: 1,
    page_slug: "shaving",
  }),
  m({
    slug: "cactus-nose",
    name: "サボテンノーズ（鼻毛ワックス）",
    category: "option",
    description: "シェービング・フェイシャルに追加できるオプションです。",
    duration_min: 10,
    price_note: "オプション",
    sort_order: 2,
    page_slug: "shaving",
  }),
  m({
    slug: "hair-growth-single",
    name: "育毛ケア（1回）",
    category: "hair_growth",
    description:
      "カウンセリング＋頭皮診断＋育毛施術＋頭皮確認＋アフターカウンセリング。KIRASUIを基本技術とした集中頭皮ケア。",
    duration_min: 90,
    price_yen: 17600,
    price_status: "fixed",
    price_note: "税込",
    sort_order: 1,
    page_slug: "hair-growth",
  }),
  m({
    slug: "hair-growth-3m",
    name: "育毛プログラム（お試し3ヶ月）",
    category: "hair_growth",
    description: "2週間に1回の来店を基本とした、お試し3ヶ月プログラム。",
    sort_order: 2,
    page_slug: "hair-growth",
  }),
  m({
    slug: "hair-growth-6m",
    name: "育毛プログラム（基本6ヶ月）",
    category: "hair_growth",
    description: "2週間に1回の来店を基本とした、基本の6ヶ月プログラム。",
    is_recommended: true,
    sort_order: 3,
    page_slug: "hair-growth",
  }),
  m({
    slug: "inner-beauty",
    name: "インナービューティー相談",
    category: "inner_beauty",
    description:
      "食事・ファスティング・内側からのケアの相談。外側だけではなく、内側からも自分を整える。",
    price_status: "hidden",
    price_note: "ご相談はLINEから",
    sort_order: 1,
    page_slug: "inner-beauty",
  }),
  m({
    slug: "slimming",
    name: "メンズ痩身",
    category: "slimming",
    description: "隣接エステサロンの設備を利用した男性向け痩身ケア。完全予約制。",
    price_status: "hidden",
    price_note: "完全予約制・詳細はLINEで",
    sort_order: 1,
    page_slug: "slimming",
  }),
  m({
    slug: "mimitsubo",
    name: "耳つぼセラピー",
    category: "mimitsubo",
    description:
      "ヘッドスパなどと組み合わせられる追加ケア。耳つぼシールを使用し、肩・腰などのポイントを扱います。",
    duration_min: 15,
    price_yen: 1650,
    price_status: "fixed",
    price_note: "追加オプション・単品の場合2,200円",
    sort_order: 1,
    page_slug: "head-spa",
  }),
  m({
    slug: "gift",
    name: "グルーミングギフト",
    category: "gift",
    description:
      "ヘッドスパ35分＋シェービング＋フェイシャル。大切な男性に「整える時間」を贈るギフト体験（カットなし）。",
    duration_min: 90,
    price_status: "hidden",
    price_note: "料金はLINEでご案内",
    sort_order: 1,
    page_slug: "gift",
  }),
  m({
    slug: "membership",
    name: "年間メンバーシップ",
    category: "membership",
    description:
      "カット＋シェービング＋ヘッドスパを年間12回。毎月ここで整えると決めた方のための会員制度（準備中）。",
    price_status: "hidden",
    price_note: "準備中",
    sort_order: 1,
    page_slug: "membership",
  }),
];

export const fallbackFaqs: Faq[] = [
  {
    question: "美容やヘッドスパの知識がまったくないのですが、大丈夫ですか？",
    answer:
      "はい、まったく問題ありません。当店のお客様のほとんどは「美容に詳しい方」ではなく、「最近疲れが取れない」「髪や頭皮が気になってきた」という35〜50代の男性です。カウンセリングで丁寧にお伺いしますので、何を相談すればいいか分からない状態のままお越しください。",
    category: "初めての方",
    sort_order: 1,
  },
  {
    question: "どのメニューを選べばいいか分かりません。",
    answer:
      "迷ったら、LINEで「どれを選べばいいか分からない」とそのままお送りください。ご希望やお悩みを伺ってご提案します。初めての方には、カット・シェービング・50分ヘッドスパがセットになった初回グルーミングコースをおすすめすることが多いです。",
    category: "初めての方",
    sort_order: 2,
  },
  {
    question: "施術中は会話をしないといけませんか？",
    answer:
      "いいえ。当店は施術中の会話を基本的にお求めしません。照明を落とした静かな空間で、スマホからも少し離れて「何もしなくていい時間」をお過ごしください。もちろん、お話ししたい方はお気軽にどうぞ。",
    category: "過ごし方",
    sort_order: 3,
  },
  {
    question: "本当に男性専用ですか？",
    answer:
      "はい、男性専用サロンです。女性のお客様が多い美容室が苦手な方、人目を気にせず美容の相談をしたい方に落ち着いてお過ごしいただける空間です。",
    category: "過ごし方",
    sort_order: 4,
  },
  {
    question: "駐車場はありますか？",
    answer: "19台分の無料駐車場がございます。お車でのご来店が便利です。",
    category: "アクセス",
    sort_order: 5,
  },
  {
    question: "初回はどのくらい時間がかかりますか？",
    answer:
      "初回グルーミングコースは約120分です。カウンセリング、頭皮診断、カット、シェービング、ヘッドスパ、肩マッサージ、頭皮確認、アフターカウンセリングまで含みます。",
    category: "初めての方",
    sort_order: 6,
  },
  {
    question: "予約はどうすればいいですか？",
    answer:
      "公式LINEからご希望のメニューと日時候補をお送りください。空き状況を確認のうえ、こちらからご連絡します。当店は完全予約制です。",
    category: "予約",
    sort_order: 7,
  },
  {
    question: "支払い方法は何が使えますか？",
    answer:
      "現金のほか、各種キャッシュレス決済に対応しています。詳しくはLINEでお問い合わせください。",
    category: "予約",
    sort_order: 8,
  },
].map((f, i) => ({ ...f, id: `fallback-${i}`, is_published: true }));

export const fallbackImages: ImageSlot[] = [
  ["logo", "/images/logo.png", "MEN'S GROOMING SPA umbrella", "ロゴ"],
  ["hero_top", "/images/hero_top.jpg", "落ち着いた男性専用サロンの空間", "トップのメイン写真"],
  ["salon_interior", "/images/salon.jpg", "店内の様子", "店内写真"],
  ["owner_portrait", "/images/owner.jpg", "オーナー 井上孝志", "井上さんの写真"],
  ["head_spa_hero", "/images/head_spa.jpg", "ヘッドスパ施術の様子", "ヘッドスパページの写真"],
  ["facial_hero", "/images/facial.jpg", "フェイシャルケアの様子", "フェイシャルページの写真"],
  ["shaving_hero", "/images/shaving.jpg", "シェービングの様子", "シェービングページの写真"],
  ["first_visit_hero", "/images/first_visit.jpg", "初回カウンセリングの様子", "初めての方へページの写真"],
  ["hair_growth_hero", "/images/hair_growth.jpg", "頭皮診断の様子", "育毛ページの写真"],
  ["inner_beauty_hero", "/images/inner_beauty.jpg", "インナービューティーのイメージ", "インナービューティーページの写真"],
  ["slimming_hero", "/images/slimming.jpg", "痩身ケアのイメージ", "痩身ページの写真"],
  ["gift_hero", "/images/gift.jpg", "ギフトのイメージ", "ギフトページの写真"],
  ["voice_1", "/images/voice_1.jpg", "お客様の声", "お客様の声1"],
  ["voice_2", "/images/voice_2.jpg", "お客様の声", "お客様の声2"],
].map(([slot_key, url, alt, label]) => ({
  slot_key,
  url,
  alt,
  label,
  width: null,
  height: null,
}));

export const fallbackPosts: Post[] = [];
