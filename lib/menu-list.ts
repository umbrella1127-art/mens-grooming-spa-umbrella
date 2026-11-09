// メニュー・料金一覧（/menu）のデータ。
// CMSのmenusテーブルは各詳細ページ用の代表メニューを持つが、
// 一覧はセットの組み合わせが多く1テーブルでは表現しきれないためここで管理する。

export interface MenuItem {
  name: string;
  /** 補足。所要時間や注意書きなど */
  note?: string;
  /** キャンペーン価格。「〜」を含む場合はそのまま書く */
  price: string;
  /** 通常価格。設定した場合は取り消し線付きで併記される */
  originalPrice?: string;
}

export interface MenuGroup {
  id: string;
  en: string;
  title: string;
  lead?: string;
  items: MenuItem[];
  /** 関連する詳細ページ */
  detail?: { href: string; label: string };
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    id: "set",
    en: "Set Course",
    title: "カット込みのセットコース",
    lead: "カット・シェービングに、ヘッドスパやフェイシャルを組み合わせたコースです。月に一度のメンテナンスとしてご利用いただけます。",
    detail: {
      href: "/menu/first-grooming",
      label: "初めての方向けの3コースを見る",
    },
    items: [
      {
        name: "カット＋シェービング＋ヘッドスパ「月」35分",
        price: "¥9,900",
        originalPrice: "¥11,000",
      },
      {
        name: "カット＋シェービング＋ヘッドスパ「浄」50分",
        price: "¥12,870",
        originalPrice: "¥14,300",
      },
      {
        name: "カット＋シェービング＋ライトGROOMINGフェイシャル",
        price: "¥8,800",
        originalPrice: "¥9,350",
      },
      {
        name: "カット＋シェービング＋ベーシックGROOMINGフェイシャル",
        price: "¥9,900",
        originalPrice: "¥11,000",
      },
      {
        name: "カット＋シェービング＋プレミアムGROOMINGフェイシャル",
        price: "¥10,890",
        originalPrice: "¥14,300",
      },
      {
        name: "カット＋シェービング＋ヘッドスパ「月」＋ベーシックGROOMINGフェイシャル",
        price: "¥13,860",
        originalPrice: "¥15,400",
      },
      {
        name: "カット＋シェービング＋ヘッドスパ「月」＋プレミアムGROOMINGフェイシャル",
        price: "¥17,820",
        originalPrice: "¥19,800",
      },
      {
        name: "カット＋シェービング＋ヘッドスパ「浄」＋プレミアムGROOMINGフェイシャル",
        price: "¥20,790",
        originalPrice: "¥23,100",
      },
    ],
  },
  {
    id: "no-cut",
    en: "No Cut",
    title: "カットなしのコース",
    lead: "髪を切る予定がない日も、頭皮と肌だけを整えにお越しいただけます。ヘッドスパだけ、フェイシャルだけのご来店も歓迎しています。",
    detail: { href: "/menu/head-spa", label: "ヘッドスパについて詳しく見る" },
    items: [
      {
        name: "ヘッドスパ「月」35分",
        note: "頭皮のクレンジングと保湿。マイクロスコープでの頭皮診断付き",
        price: "¥7,700",
        originalPrice: "¥8,800",
      },
      {
        name: "ヘッドスパ「浄」50分",
        note: "オイルで頭皮を保湿する上位コース。40代後半〜50代以上の方におすすめ",
        price: "¥10,450",
        originalPrice: "¥11,550",
      },
      {
        name: "シェービング＋ベーシックGROOMINGフェイシャル",
        price: "¥7,700",
        originalPrice: "¥9,900",
      },
      {
        name: "シェービング＋ヘッドスパ「月」＋ベーシックGROOMINGフェイシャル",
        price: "¥10,450",
        originalPrice: "¥12,100",
      },
      {
        name: "シェービング＋ヘッドスパ「月」＋プレミアムGROOMINGフェイシャル",
        price: "¥13,860",
        originalPrice: "¥16,500",
      },
    ],
  },
  {
    id: "hair",
    en: "Hair",
    title: "カット・カラー",
    items: [
      { name: "カット", price: "¥7,700" },
      {
        name: "メンズカラー",
        note: "カラーのみのご予約は承っておりません",
        price: "¥5,500",
      },
      {
        name: "メンズトリートメントカラー",
        note: "カラーのみのご予約は承っておりません",
        price: "¥7,700",
      },
    ],
  },
  {
    id: "care",
    en: "Other Care",
    title: "その他のケア",
    items: [
      {
        name: "育毛ケア（抜け毛予防コース）",
        note: "マイクロスコープでの頭皮診断付き。回数制のコースもご用意しています",
        price: "¥17,600〜",
      },
      { name: "フェイシャルエステ", price: "¥6,600〜" },
      {
        name: "ハーブピーリング",
        note: "毛穴・テカリ・ざらつきが気になる方へ",
        price: "¥8,800",
        originalPrice: "¥12,100",
      },
      {
        name: "耳つぼセラピー",
        note: "他メニューとの組み合わせは¥1,650",
        price: "¥2,200",
      },
      {
        name: "サボテンノーズ（鼻毛ワックス）",
        note: "オプションとして追加いただけます",
        price: "¥990",
      },
      {
        name: "メンズ痩身",
        note: "完全予約制。内容・料金はカウンセリングでご案内します",
        price: "LINEでご相談ください",
      },
      {
        name: "インナービューティー相談",
        note: "食事・ファスティングなど内側からのケア",
        price: "LINEでご相談ください",
      },
    ],
  },
];

export const MENU_NOTE =
  "表示価格はすべて税込です。\nコースの組み合わせは上記以外にもご用意しています。「どれを選べばいいか分からない」という状態のままで大丈夫ですので、LINEでお気軽にご相談ください。";

/** /menu の選び方ブロック。「月」「浄」はヘッドスパの内容の名前で、コース名ではないことを伝える */
export const MENU_PICK_TERMS = [
  {
    term: "月（つき）",
    body: "ヘッドスパ35分の入門コース。頭皮のクレンジングと保湿を行います。マイクロスコープでの頭皮診断付き。悩みがなくても、定期的にケアしたい方におすすめです。",
  },
  {
    term: "浄（じょう）",
    body: "ヘッドスパ50分。オイルで頭皮を保湿し、年齢を重ねた頭皮をいたわる（エイジングケア）コースです。月の保湿とは別のケアです。施術後の睡眠について、変化が見られたというモニター調査のデータもあります（個人差があります）。40代後半〜50代以上の方に、特におすすめしています。",
  },
];

export const MENU_PICK_TERMS_NOTE =
  "どちらも、カット・シェービングがつくセットと、ヘッドスパだけのコースがあります。ご相談の際は「カット＋シェービング＋ヘッドスパ浄」のように、内容も添えてお伝えいただくと行き違いがありません。";
