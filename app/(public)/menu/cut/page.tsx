import Link from "next/link";
import CtaSection from "@/components/sections/CtaSection";
import FaqList from "@/components/sections/FaqList";
import MenuCard from "@/components/sections/MenuCard";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getImages, getMenus, getSettings } from "@/lib/cms";
import { MENU_GROUPS } from "@/lib/menu-list";
import { buildMetadata, faqJsonLd, JsonLd } from "@/lib/seo";
import type { Faq } from "@/lib/types";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "前橋のメンズカット｜30代後半・40代からの身だしなみ",
    description:
      "前橋市小相木町の男性専用理容室。骨格やくせ毛に合わせたメンズカットと、フルフラットシャンプー、肩のマッサージ。ヘッドスパやフェイシャルで、大人の男性の身だしなみをサポートします。",
    path: "/menu/cut",
  });
}

type Para = string | { b: string };

interface Story {
  no?: string;
  en: string;
  title: string;
  paragraphs: Para[];
}

const INTRO_TITLE = "30代半ばからの男性に、髪型だけではない身だしなみを。";

const INTRO: Para[] = [
  "30代も半ばを過ぎた頃から、自分の変化を感じることはありませんか。",
  "以前より髪がまとまりにくくなった。ふと鏡を見ると、目元のシワが気になる。写真に写った自分を見て、「なんだか老けたな」と感じる。",
  "若い頃はそれほど気にしていなかった、頭皮や肌、そして自分自身のニオイ。年齢を重ねるにつれて、気になることも少しずつ変わってきます。",
  "そして、もう一つ。",
  { b: "自分がどう見られているか。" },
  "仕事で人と会うとき、女性と接するとき、家族と過ごすとき。自分では気づかない部分も、相手には見えているかもしれません。",
  "だからこそ、大人の男性にとって身だしなみは、髪型だけでは十分ではないと私は考えています。",
  "髪を整え、頭皮をいたわり、顔の肌までケアする。",
  "前橋市小相木町のMEN'S GROOMING SPA umbrellaは、そんな大人の男性のためのグルーミングを大切にしている男性専用理容室です。",
];

const STORIES: Story[] = [
  {
    no: "01",
    en: "Bone Structure",
    title: "今の自分に似合う髪型を。",
    paragraphs: [
      "若い頃から、ずっと同じ髪型にしていませんか。もちろん、気に入った髪型を続けるのもいいと思います。",
      "ただ、30代半ばを過ぎた頃から、髪質やくせの変化を感じる男性もいらっしゃいます。以前と同じようにセットしても、なんとなく決まらない。そんなこともあるかもしれません。",
      "当店では、頭の形や骨格、髪の生え方などを見ながら、その方に合った髪型を考えています。無理に若く見せるのではなく、今の自分に自然に似合う髪型を。",
      { b: "年齢を重ねた今だからこそ似合う、自然な格好よさを大切にしています。" },
    ],
  },
  {
    no: "02",
    en: "Curly Hair",
    title: "くせ毛は、無理に抑えなくてもいい。",
    paragraphs: [
      "「横が膨らんでしまう」「朝、セットしても思うようにまとまらない」。そんな髪の悩みはありませんか。",
      "私は、くせ毛を悪いものだと決めつけてはいません。くせの出方によっては、その自然な動きを生かしたほうが、いい雰囲気になることもあります。",
      "髪の生え方やくせを見ながら、扱いやすい形を考えてカットする。",
      { b: "自分の髪質を無理に変えようとするのではなく、今ある髪を生かす。" },
      "そんな考え方を大切にしています。",
    ],
  },
  {
    en: "Men Only",
    title: "男性だけの空間だから、気を遣わずに過ごせる。",
    paragraphs: [
      "お店に行くと、周りが女性のお客様ばかりで、なんとなく落ち着かない。そんな経験はありませんか。",
      "当店は男性専用の理容室です。女性のお客様に囲まれることも、周りの目を必要以上に気にすることもありません。",
      "ヘッドスパやフェイシャルに興味はあっても、少し恥ずかしいと感じていた男性にも、気兼ねなく体験していただきたいと思っています。",
      "美容に詳しくなくても、無理に会話を盛り上げる必要もありません。初めての方には、髪型や気になることを伺いながら、施術内容もわかりやすくご説明します。",
      { b: "男性だからこそ、気兼ねなく自分の身だしなみを整えられる場所。" },
      "そんな空間を大切にしています。",
    ],
  },
  {
    no: "03",
    en: "Shampoo",
    title: "シャンプーは、カットのおまけではありません。",
    paragraphs: [
      "普段、自分で髪を洗うのと、人に洗ってもらうのとでは、感じ方が違いませんか。",
      "当店では、フルフラットのシャンプー台で、横になってシャンプーを受けていただきます。身体を預け、目を閉じて、頭をしっかり洗ってもらう。",
      "仕事のこと、明日の予定、家のこと。普段は何かと考えることが多い男性も、この時間くらいは何も考えずに過ごしていただきたいと思っています。",
      "お客様から、こんな言葉をいただいたことがあります。",
      "「頭を洗ってもらっているのに、疲れも一緒に流してもらっているような感じがします」",
      "髪を洗うことはもちろんですが、その時間そのものを楽しんでいただきたい。",
      { b: "だから、当店ではシャンプーも大切な施術の一つです。" },
    ],
  },
  {
    no: "04",
    en: "Shoulder",
    title: "肩のマッサージまでが、私のカットです。",
    paragraphs: [
      "シャンプーが終わったら、最後に肩のマッサージを行います。",
      "私は長年スポーツを続けてきました。その中で、先輩や仲間の肩や身体のケアをする機会がたくさんありました。その経験が、今のサロンワークにもつながっています。",
      "仕事で忙しい男性ほど、自分の身体をいたわる時間は後回しになりがちです。だからこそ、髪を切りに来たときくらいは、少しゆっくりしていただきたい。",
      "実際に、お客様からはこんな言葉もいただいています。",
      "「シャンプーと肩のマッサージだけで、整体に行ったような感覚があります」",
      "髪型が整うことはもちろん大切です。でも、帰るときに「今日も来てよかった」と感じていただけたら、それもうれしいことです。",
      { b: "髪を切るだけでは終わらない。そんな時間を大切にしています。" },
    ],
  },
];

const VOICES = [
  "頭を洗ってもらっているのに、疲れも一緒に流してもらっているような感じがします。",
  "シャンプーと肩のマッサージだけで、整体に行ったような感覚があります。",
];

const CUT_ITEM = MENU_GROUPS.find((g) => g.id === "hair")?.items.find((i) => i.name === "カット");
// 一覧（/menu）と同じデータから引く。「¥7,700」を文中向けに「7,700円」へ整える
const CUT_PRICE = CUT_ITEM ? `${CUT_ITEM.price.replace("¥", "")}円` : null;

const WHY: Para[] = [
  "ある日、ふと鏡を見たとき。「こんなところにシワがあったかな」「最近、なんだか顔が老けた気がする」。そんなふうに感じたことはありませんか。",
  "30代半ばを過ぎた頃から、髪だけでなく、顔や肌の変化が気になり始める男性もいらっしゃいます。",
  "そして、もう一つ意識しておきたいのが、周囲からの見え方です。仕事で人と接するとき、初めて会う人と話すとき、女性と接するとき。自分が思っている以上に、髪型だけでなく、肌の印象や清潔感、ニオイなども身だしなみの一部になります。",
  "若い頃は、髪型を整えるだけで十分だと感じていたかもしれません。でも、年齢を重ねた男性には、それだけでは足りない部分もあると思うのです。",
  "だからといって、無理に若作りをする必要はありません。大切なのは、年齢を重ねた今の自分に合ったケアをすること。",
  `当店では、カットのみのメニューもご用意していますが、基本的にはヘッドスパやフェイシャルなどを組み合わせたグルーミングコースをおすすめしています。${
    CUT_PRICE ? `（カットのみは${CUT_PRICE}（税込）、所要時間は約60分です。）` : ""
  }`,
  "ヘッドスパでは、頭皮を清潔に保ち、年齢を重ねた頭皮をいたわるケアを。フェイシャルでは、顔の肌を丁寧にケアし、清潔感のある身だしなみを整えていきます。",
  "ニオイが気になる方にとっても、頭皮や肌を清潔に保つことは日頃の身だしなみの一つです。もちろん、ヘッドスパやフェイシャルだけですべての年齢変化やニオイに対応できるわけではありません。それでも、髪型だけでなく、頭皮や顔まで目を向けるきっかけになればと思っています。",
  "当店は男性専用の理容室です。美容に詳しくなくても、周りの目を気にせず、自然体でお越しいただけます。",
  { b: "若く見せるためではなく、年齢を重ねても清潔感のある、格好いい男性でいるために。" },
  "髪を切る日を、自分自身の身だしなみを見直す日にしてみませんか。",
];

const CUT_FAQS: Faq[] = [
  {
    question: "似合う髪型がわからなくても大丈夫ですか？",
    answer:
      "はい、大丈夫です。髪型の希望をうまく伝えられなくても、頭の形や髪の生え方、くせなどを見ながら、一緒に考えていきます。最初にお話を伺いますので、気になることがあれば遠慮なくお伝えください。",
  },
  {
    question: "30代後半・40代・50代でも似合う髪型にしてもらえますか？",
    answer:
      "はい。当店では、30代半ば以降の男性に向けて、今の自分に似合う髪型を大切にしています。無理に若く見せるのではなく、自然な格好よさを考えてカットします。",
  },
  {
    question: "カットだけでも予約できますか？",
    answer: `はい。${
      CUT_PRICE ? `カットのみは${CUT_PRICE}（税込）、` : ""
    }所要時間は約60分です。ただし、頭皮や肌のケアも大切にしているため、ヘッドスパなどを組み合わせたコースもおすすめしています。`,
  },
  {
    question: "ヘッドスパやフェイシャルを受けたことがないのですが、大丈夫ですか？",
    answer:
      "もちろん大丈夫です。初めての方にも、施術内容をわかりやすくご説明します。わからないことや気になることがあれば、お気軽にご相談ください。",
  },
  {
    question: "コースの所要時間はどれくらいですか？",
    answer: "メニューによって異なります。詳しくはメニューページをご確認ください。",
  },
  {
    question: "予約方法を教えてください。",
    answer: "ご予約・お問い合わせはLINEから承っています。",
  },
].map((f, i) => ({
  ...f,
  id: `cut-faq-${i + 1}`,
  category: "cut",
  sort_order: i + 1,
  is_published: true,
}));

const CLOSING: Para[] = [
  "髪が伸びたら切りに行く。それだけで十分だった頃もあると思います。",
  "でも、30代半ばを過ぎると、髪だけでなく、肌や頭皮のことも少しずつ気になってくる。ふと鏡を見たときの自分の顔。仕事で人と会うときの清潔感。年齢を重ねるほど、自分がどう見られているかも大切になってきます。",
  "だからこそ、髪型だけでなく、頭皮や顔まで整える時間を持ってほしいと思っています。",
  "当店では、骨格やくせ毛に合わせたカットに加え、ヘッドスパやフェイシャルなど、男性のためのグルーミングをご用意しています。そして、フルフラットのシャンプー台や肩のマッサージで、心地よい時間も過ごしていただきたい。",
  "男性専用の空間だからこそ、周りに気を遣わず、自分のための時間を過ごしていただけます。",
  { b: "年齢を重ねても、格好よくありたい。そんな気持ちを、当店は大切にしています。" },
  "次に髪を切る日は、髪だけでなく、自分自身を整える日にしてみませんか。",
];

function Paras({ items }: { items: Para[] }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5 text-sm leading-loose text-charcoal-light">
      {items.map((p) =>
        typeof p === "string" ? (
          <p key={p}>{p}</p>
        ) : (
          <p key={p.b} className="font-serif-jp text-base text-ink">
            {p.b}
          </p>
        ),
      )}
    </div>
  );
}

export default async function CutPage() {
  const [settings, menus, images] = await Promise.all([
    getSettings(),
    getMenus(),
    getImages(),
  ]);
  const cutMenus = menus.filter((m) => m.category === "first_grooming");

  return (
    <>
      <JsonLd data={faqJsonLd(CUT_FAQS)} />
      <PageHero
        en="Cut"
        title="前橋のメンズカット｜髪を切るだけで、終わらせない。"
        lead={
          "骨格やくせ毛に合わせたカットに、シャンプーと肩のマッサージまで。\nヘッドスパやフェイシャルで、年齢を重ねた男性の身だしなみを整えます。"
        }
        imageUrl={images.owner_cutting?.url}
        imageAlt={images.owner_cutting?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <FadeIn>
            <p className="mx-auto mb-8 max-w-2xl text-center font-serif-jp text-lg text-ink">
              {INTRO_TITLE}
            </p>
            <Paras items={INTRO} />
          </FadeIn>
        </Container>
      </section>

      {STORIES.map((s, i) => (
        <section
          key={s.en}
          className={`py-16 md:py-24 ${i % 2 === 0 ? "bg-paper-dark" : ""}`}
        >
          <Container>
            <SectionHeading en={s.en}>{s.no ? `${s.no}｜${s.title}` : s.title}</SectionHeading>
            <FadeIn>
              <Paras items={s.paragraphs} />
            </FadeIn>
          </Container>
        </section>
      ))}

      <section className="bg-charcoal py-16 text-paper md:py-24">
        <Container>
          <SectionHeading en="Voice" tone="light">
            お客様が教えてくれた、当店の価値。
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
              {VOICES.map((v) => (
                <figure key={v} className="rounded-sm bg-ink p-6 text-center">
                  <blockquote className="text-sm leading-loose text-beige">
                    「{v}」
                  </blockquote>
                </figure>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-loose text-greige">
              ※お客様からいただいた個人の感想です。施術による効果を保証するものではありません。
            </p>
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Why">
            カットだけで終わらせない理由｜年齢を重ねるほど、どう見られているかも大切になる。
          </SectionHeading>
          <FadeIn>
            <Paras items={WHY} />
          </FadeIn>
        </Container>
      </section>

      {cutMenus.length > 0 && (
        <section className="bg-paper-dark py-16 md:py-24">
          <Container>
            <SectionHeading en="Menu">カットを含むメニュー</SectionHeading>
            <FadeIn>
              {CUT_PRICE && (
                <p className="mx-auto mb-8 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
                  カットのみ｜{CUT_PRICE}（税込）　所要時間：約60分
                </p>
              )}
              <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
                {cutMenus.map((menu) => (
                  <MenuCard key={menu.slug} menu={menu} />
                ))}
              </div>
              <p className="mt-6 text-center text-sm leading-loose text-charcoal-light">
                初めての方は、
                <Link href="/menu/first-grooming" className="text-brown underline underline-offset-4">
                  初回グルーミングコース
                </Link>
                {" "}をご覧ください。ほかのメニューは{" "}
                <Link href="/menu" className="text-brown underline underline-offset-4">
                  メニュー・料金
                </Link>
                {" "}へ。
              </p>
            </FadeIn>
          </Container>
        </section>
      )}

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Q&A">カットのよくある質問</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <FaqList faqs={CUT_FAQS} />
              <p className="mt-8 text-center text-sm leading-loose text-charcoal-light">
                場所・営業時間は{" "}
                <Link href="/access" className="text-brown underline underline-offset-4">
                  アクセス
                </Link>
                {" "}のページをご覧ください。
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="For You">前橋で、大人の男性が通える理容室をお探しの方へ。</SectionHeading>
          <FadeIn>
            <Paras items={CLOSING} />
            <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-loose text-greige">
              MEN&apos;S GROOMING SPA umbrella／群馬県前橋市小相木町／男性専用理容室
            </p>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="次に髪を切る日は、自分を整える日にしてみませんか。"
        body="ご予約・お問い合わせはLINEから承っています。"
        section="cut_bottom"
        menu="first_grooming"
      />
    </>
  );
}
