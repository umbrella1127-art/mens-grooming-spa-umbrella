// 初回グルーミング3コース。トップページと /menu/first-grooming で共有する。
// 通常価格→キャンペーン価格の2段表示はCMSのprice_yen 1項目では表現できないため、
// この3コースだけはここを唯一の情報源とする（menusテーブルは管理画面での参照用）。

export interface FirstGroomingCourse {
  key: string;
  /** 英語のコース名。カード上で大きく見せる */
  nameEn: string;
  /** 日本語の補足。英語名の下に小さく添える */
  nameJa: string;
  duration: string;
  /** 施術内容の1行 */
  content: string;
  description: string;
  originalPrice: string;
  campaignPrice: string;
  recommended: boolean;
}

export const FIRST_GROOMING_COURSES: FirstGroomingCourse[] = [
  {
    key: "grooming",
    nameEn: "GROOMING",
    nameJa: "身だしなみを整える",
    duration: "約120分",
    content: "カット＋シェービング＋ヘッドスパ「月」35分。",
    description:
      "髪・顔・頭を一度に整える、umbrellaの基本コース。まずは月に一度のメンテナンスを始めたい方におすすめです。",
    originalPrice: "¥11,000",
    campaignPrice: "¥9,900",
    recommended: false,
  },
  {
    key: "deep-rest",
    nameEn: "DEEP REST",
    nameJa: "深く休む",
    duration: "約150分",
    content: "カット＋シェービング＋ヘッドスパ「浄」50分。",
    description:
      "頭浸浴と専用オイルを使い、頭から肩までじっくりとほぐします。脳疲労や、休んでも抜けにくい疲れを感じている方へ。",
    originalPrice: "¥14,300",
    campaignPrice: "¥12,870",
    recommended: false,
  },
  {
    key: "total-care",
    nameEn: "TOTAL CARE",
    nameJa: "印象まで整える",
    duration: "約180分",
    content:
      "カット＋シェービング＋ヘッドスパ「月」35分＋ベーシックGROOMINGフェイシャル。",
    description:
      "髪と頭を整えるだけでなく、疲れや年齢が表れやすい肌までケア。清潔感のある印象と、自信を取り戻したい方のためのコースです。",
    originalPrice: "¥15,400～",
    campaignPrice: "¥13,860～",
    recommended: true,
  },
];

/** 3コースの上に置く導入文 */
export const FIRST_GROOMING_LEAD = [
  "身だしなみを整えたい。\n溜まった疲れを深く休ませたい。\n疲れて見える顔までケアしたい。",
  "今の自分に合うコースをお選びください。",
  "下記は、初めての方にもおすすめしているカット込みのセットコースです。もちろん、カットなしでもご利用いただけます。",
  "umbrellaは、ヘッドスパを中心としたサロンです。",
  "「ヘッドスパだけで予約するのは申し訳ない」と、気を遣う必要はありません。ヘッドスパだけ、フェイシャルだけのご来店も、心から歓迎しています。",
];

/** 3コースの下に置く締めの文 */
export const FIRST_GROOMING_NOTE =
  "どれを選べばよいか迷った方には、ヘッドスパとフェイシャルを一度に体験できる「TOTAL CARE」をおすすめしています。\n髪・頭・顔までまとめて整える、umbrellaの価値を最も実感していただけるコースです。";
