import Image from "next/image";
import Link from "next/link";
import LineCtaLink from "@/components/analytics/LineCtaLink";
import CampaignPriceCard from "@/components/sections/CampaignPriceCard";
import CtaSection from "@/components/sections/CtaSection";
import FaqList from "@/components/sections/FaqList";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import StarRating from "@/components/ui/StarRating";
import { getFaqs, getImages, getSettings } from "@/lib/cms";
import {
  FIRST_GROOMING_COURSES,
  FIRST_GROOMING_LEAD,
  FIRST_GROOMING_NOTE,
} from "@/lib/first-grooming";
import { buildMetadata, JsonLd, localBusinessJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    description:
      "群馬県前橋市の男性専用グルーミングサロン。カット・シェービング・ヘッドスパ・頭皮診断・フェイシャル・育毛まで、美容に詳しくなくても相談できる場所。月に一度、自分を整える。",
    path: "/",
  });
}

const FOR_YOU_POINTS = [
  "一晩眠っても、疲れが抜けなくなってきた",
  "パソコンやスマートフォンで、目・頭・肩が重い",
  "髪が細くなり、以前よりボリュームが出にくい",
  "鏡を見たとき、顔が疲れていると感じる",
  "肌のテカリや毛穴、年齢による変化が気になり始めた",
  "ヘッドスパや肌ケアに興味はあるが、何を選べばいいか分からない",
  "女性のお客様が多い美容室では、どうも落ち着かない",
  "美容には詳しくないけれど、今より少しかっこよくなりたい",
];

const OTHER_CARE = [
  { href: "/menu/facial", title: "フェイシャル", body: "肌を測って、整える" },
  { href: "/menu/shaving", title: "シェービング", body: "身だしなみを整える" },
  { href: "/menu/hair-growth", title: "育毛", body: "頭皮と向き合う集中ケア" },
  {
    href: "/menu/inner-beauty",
    title: "インナービューティー",
    body: "内側から整える相談",
  },
  { href: "/menu/slimming", title: "メンズ痩身", body: "身体を整える（完全予約制）" },
  { href: "/menu/head-spa", title: "耳つぼセラピー", body: "組み合わせる追加ケア" },
];

export default async function TopPage() {
  const [settings, faqs, images] = await Promise.all([
    getSettings(),
    getFaqs(),
    getImages(),
  ]);

  const topFaqs = faqs.slice(0, 3);

  return (
    <>
      <JsonLd data={localBusinessJsonLd(settings)} />

      {/* ① ファーストビュー + ② 35歳以降の変化（共感型コピー） */}
      <section className="relative flex min-h-[82svh] items-end overflow-hidden bg-ink text-paper">
        {images.hero_top && (
          <>
            <Image
              src={images.hero_top.url}
              alt={images.hero_top.alt}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
            {/* 下端だけに影。写真の上〜中央は鮮明なまま見せる。 */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          </>
        )}
        <Container className="relative pt-24 pb-16 md:pb-20">
          <FadeIn>
            <h1 className="mb-6 whitespace-pre-line text-3xl leading-relaxed md:text-5xl md:leading-relaxed">
              {settings.fv_copy_main}
            </h1>
            <p className="mb-10 max-w-xl text-sm text-beige md:text-base">
              {settings.fv_copy_sub}
            </p>
            <LineCtaLink
              href={settings.line_url}
              ctaType="line_hero"
              section="hero"
              className="inline-block rounded-sm bg-paper px-10 py-4 text-sm tracking-wider text-ink transition-opacity hover:opacity-85"
            >
              {settings.cta_primary_label}
            </LineCtaLink>
            <p className="mt-4 text-xs text-greige">{settings.cta_sub_label}</p>
          </FadeIn>
        </Container>
      </section>

      {/* ③ 共感 */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="For You">
            「まだ大丈夫」と、自分のことを後回しにしていませんか？
          </SectionHeading>
          <FadeIn>
            <ul className="mx-auto grid max-w-3xl gap-3 md:grid-cols-2">
              {FOR_YOU_POINTS.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-3 rounded-sm bg-paper-dark px-5 py-4 text-sm"
                >
                  <span className="mt-0.5 text-brown">✓</span>
                  {c}
                </li>
              ))}
            </ul>
            <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              頑張ることには慣れていても、自分を休ませ、整えることには慣れていない。
              <br />
              ひとつでも当てはまったなら、今がメンテナンスを始めるタイミングです。
              <br />
              美容の知識も、特別な準備も必要ありません。
              <br />
              仕事の疲れも、髪や肌の悩みも、そのままお聞かせください。
              <br />
              ここは、頑張る男が月に一度、自分をゼロリセットするための休息地です。
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* ④ umbrellaとは */}
      <section className="bg-ink py-16 text-paper md:py-24">
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-2">
            <FadeIn>
              <SectionHeading en="About" align="left" tone="light">
                疲れも、髪も、肌も。
                <br />
                男のメンテナンスを、ひとつの場所で。
              </SectionHeading>
              <div className="space-y-3 text-sm leading-loose text-beige">
                <p>
                  MEN&apos;S GROOMING SPA
                  umbrellaは、ただ髪を切るためだけの理容室ではありません。
                </p>
                <p>カットとシェービングで、清潔感を整える。</p>
                <p>ヘッドスパで、仕事の疲れを頭からほどく。</p>
                <p>フェイシャルで、肌に表れ始めた年齢サインをケアする。</p>
                <p>頭皮や身体の変化は、外側と内側の両方から考える。</p>
                <p>年齢を重ねるほど、男性の悩みはひとつではなくなります。</p>
                <p>
                  だからumbrellaでは、ヘッドスパを中心に、髪・頭皮・肌・身体まで、
                  そのときの自分に必要なケアをまとめて相談できます。
                </p>
                <p>すべてのメニューを受ける必要はありません。</p>
                <p>今感じている疲れや変化を聞き、必要なケアだけをご提案します。</p>
                <p>
                  落ち着いた照明と静かな音楽の中で、目を閉じ、何も考えず、
                  すべてを任せる。
                </p>
                <p>
                  深く休んで、きちんと整い、来たときより少しかっこよくなって帰る。
                </p>
                <p>それが、umbrellaで過ごす月に一度のメンテナンスです。</p>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              {images.salon_interior && (
                <Image
                  src={images.salon_interior.url}
                  alt={images.salon_interior.alt}
                  width={720}
                  height={480}
                  className="rounded-sm object-cover"
                />
              )}
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* ⑤ ヘッドスパ */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Head Spa">
            頑張り続ける頭に、脳疲労を休める時間を。
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <p>仕事、パソコン、スマートフォン。</p>
              <p>
                身体を休めているつもりでも、脳は一日中、情報を処理し続けています。
              </p>
              <p>眠ってもすっきりしない。頭が重い。集中が続かない。</p>
              <p>そんな感覚があるなら、脳疲労を抱えているのかもしれません。</p>
              <p>
                15年以上磨いてきた技術で、頭皮を整えながら、頭から肩までじっくりと
                力を抜いていく。
              </p>
              <p>
                ただ気持ちいいだけではなく、頭も気持ちも休ませ、また明日から
                頑張るためのヘッドスパです。
              </p>
              <p>
                もし、休んでも疲れが抜けないと感じているなら、まずは一度、
                umbrellaのヘッドスパを受けてみてください。
              </p>
              <p>
                施術後に感じる頭の軽さと、何も考えずに休む時間の心地よさを、
                ぜひ体験していただきたいと思っています。
              </p>
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/menu/head-spa"
                className="border-b border-brown pb-0.5 text-sm text-brown transition-opacity hover:opacity-70"
              >
                ヘッドスパについて詳しく見る
              </Link>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ⑥ 初回3コース */}
      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="First Grooming">
            初めてのumbrellaを、3つの整え方から。
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto mb-10 max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              {FIRST_GROOMING_LEAD.map((text) => (
                <p key={text} className="whitespace-pre-line">
                  {text}
                </p>
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {FIRST_GROOMING_COURSES.map(({ key, ...course }) => (
                <CampaignPriceCard key={key} {...course} />
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-2xl whitespace-pre-line text-center text-sm leading-loose text-charcoal-light">
              {FIRST_GROOMING_NOTE}
            </p>
            <div className="mt-6 text-center">
              <Link
                href="/menu/first-grooming"
                className="border-b border-brown pb-0.5 text-sm text-brown transition-opacity hover:opacity-70"
              >
                初回グルーミングについて詳しく見る
              </Link>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ⑦ 井上さん + ⑧ ストーリー */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-5">
            <FadeIn className="md:col-span-2">
              {images.owner_portrait && (
                <Image
                  src={images.owner_portrait.url}
                  alt={images.owner_portrait.alt}
                  width={560}
                  height={700}
                  className="rounded-sm object-cover"
                />
              )}
            </FadeIn>
            <FadeIn delay={150} className="md:col-span-3">
              <SectionHeading en="Owner" align="left">
                いくつになっても、かっこよくいたい。
              </SectionHeading>
              <div className="mb-4 space-y-3 text-sm leading-loose text-charcoal-light">
                <p>口にすることは少なくても、</p>
                <p>
                  「いくつになっても、かっこよく見られたい」
                  <br />
                  「できることなら、若々しくいたい」
                </p>
                <p>そう思っている男性は、きっと少なくありません。</p>
                <p>
                  けれど、髪のことは理美容室、肌のことはエステ、身体のことは
                  別の場所。
                </p>
                <p>
                  何が自分に必要なのか、男性が美容についてまとめて相談できる
                  場所は、まだ多くありません。
                </p>
                <p>実際にお客様からも、</p>
                <p>
                  「こういうことを、どこに相談したらいいのか分からなかった」
                  <br />
                  「男性の美容をまとめて相談できる場所がなかった」
                </p>
                <p>と、よく言われます。</p>
                <p>
                  だからumbrellaでは、ヘッドスパを中心に、カット、シェービング、
                  フェイシャル、頭皮、身体、内側からのケアまで、男性の変化を
                  まとめて相談できる場所を目指しています。
                </p>
                <p>
                  無理に若作りをするのではなく、年齢を重ねた今の自分に似合う、
                  清潔感と若々しさを整える。
                </p>
                <p>鏡を見たときに、少し自信が持てる。</p>
                <p>人に会うとき、少し気持ちが前を向く。</p>
                <p>そんな変化を持ち帰ってもらいたいと思っています。</p>
                <p>
                  美容に詳しくなくても、何を選べばよいか分からなくても
                  大丈夫です。
                </p>
                <p>
                  「最近、少し疲れて見える」
                  <br />
                  「髪や肌が変わってきた気がする」
                </p>
                <p>そのくらいの相談から、お聞かせください。</p>
                <p>「この人になら、相談できる」</p>
                <p>そう思っていただける存在であることを、大切にしています。</p>
              </div>
              <Link
                href="/about"
                className="border-b border-brown pb-0.5 text-sm text-brown transition-opacity hover:opacity-70"
              >
                井上について詳しく見る
              </Link>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* ⑨ 口コミ */}
      <section className="bg-charcoal py-16 text-paper md:py-24">
        <Container>
          <SectionHeading en="Voice" tone="light">
            お客様の声
          </SectionHeading>
          <FadeIn>
            <div className="grid gap-6 md:grid-cols-2">
              <figure className="rounded-sm bg-ink p-8">
                <StarRating rating={5} className="mb-4 justify-start" />
                <blockquote className="mb-4 text-sm leading-loose text-beige">
                  「普通の美容室のヘッドスパとは全然違って、本格的でした。
                  終わったあと、頭も気持ちも軽くなった感じがします。」
                </blockquote>
                <figcaption className="flex items-center gap-1.5 text-xs text-greige">
                  <Image
                    src="/images/icon_male.png"
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 opacity-80"
                  />
                  40代・男性
                </figcaption>
              </figure>
              <figure className="rounded-sm bg-ink p-8">
                <StarRating rating={5} className="mb-4 justify-start" />
                <blockquote className="mb-4 text-sm leading-loose text-beige">
                  「男性だけの静かな空間で、とてもリラックスできました。
                  夫の誕生日にすすめたら、それから毎月通っています。」
                </blockquote>
                <figcaption className="flex items-center gap-1.5 text-xs text-greige">
                  <Image
                    src="/images/icon_female.png"
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 opacity-80"
                  />
                  ご紹介のお客様
                </figcaption>
              </figure>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ⑩ その他のケア */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Care Menu">その他のケア</SectionHeading>
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {OTHER_CARE.map((care) => (
                <Link
                  key={care.title}
                  href={care.href}
                  className="group rounded-sm border border-beige bg-paper p-6 transition-colors hover:border-brown"
                >
                  <p className="mb-1 font-serif-jp text-base text-ink group-hover:text-brown">
                    {care.title}
                  </p>
                  <p className="text-xs text-greige">{care.body}</p>
                </Link>
              ))}
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ⑪ 初めてでも大丈夫 */}
      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <SectionHeading en="Q&A">
            初めてでも、大丈夫です。
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <FaqList faqs={topFaqs} />
              <div className="mt-8 text-center">
                <Link
                  href="/faq"
                  className="border-b border-brown pb-0.5 text-sm text-brown transition-opacity hover:opacity-70"
                >
                  よくある質問をすべて見る
                </Link>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ⑫ 月1メンテナンス + ⑬ 完全予約制 */}
      <section className="bg-ink py-20 text-center text-paper md:py-28">
        <Container>
          <FadeIn>
            <p className="mb-6 font-serif-jp text-2xl leading-relaxed tracking-[0.1em] md:text-4xl">
              月に一度、自分を整える。
            </p>
            <p className="mx-auto max-w-xl text-sm leading-loose text-beige">
              仕事からも、スマホからも、少しだけ離れて。
              頭皮と髪と肌と身体を整えて、また次のひと月へ。
            </p>
            <p className="mt-8 text-xs tracking-wider text-greige">
              一人ひとりの時間をしっかり確保するため、完全予約制・予約枠を限定しています。
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* ⑭ LINE CTA */}
      <CtaSection settings={settings} section="top_bottom" />
    </>
  );
}
