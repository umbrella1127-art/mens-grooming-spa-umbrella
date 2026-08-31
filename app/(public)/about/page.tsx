import Image from "next/image";
import CertificateBadge from "@/components/sections/CertificateBadge";
import CtaSection from "@/components/sections/CtaSection";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import { getImages, getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "井上について",
    description:
      "MEN'S GROOMING SPA umbrella オーナー井上孝志。ヘッドスパ・アーユルヴェーダ・ファスティングなどの資格と、自身の79.5kg→63kgの体験から、男性の美容をトータルで相談できる理由をお伝えします。",
    path: "/about",
  });
}

const QUALIFICATIONS = [
  "HIGUCHI式ショートヘッドスパ 修了",
  "公認エキスパート ファスティングカウンセラー（IBF®）",
  "耳つぼセラピープロ養成講座 修了（日本耳つぼセラピープロ協会®）",
  "アーユルヴェーダ シローダーラ修了",
  "アーユルヴェーダフェイシャル修了",
  "脳疲労アドバイザー",
];

const CERTIFICATES = [
  {
    slot: "cert_headspa" as const,
    label: "HIGUCHIリーディング",
    title: "HIGUCHI式ショートヘッドスパ 修了認定証",
  },
  {
    slot: "cert_fasting" as const,
    label: "IBF（Inner Beauty Fasting Certification Institution）",
    title: "公認エキスパート ファスティングカウンセラー 認定証",
  },
  {
    slot: "cert_mimitsubo" as const,
    label: "日本耳つぼセラピープロ協会®",
    title: "耳つぼセラピープロ養成講座 修了証",
  },
];

export default async function AboutPage() {
  const [settings, images] = await Promise.all([getSettings(), getImages()]);

  return (
    <>
      <PageHero
        en="Owner"
        title="井上について"
        lead={
          "「美容のことなら、とりあえず井上さんに相談してみよう」。\nそう言ってもらえる存在でありたいと思っています。"
        }
        imageUrl={images.owner_cutting?.url}
        imageAlt={images.owner_cutting?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <div className="grid items-start gap-10 md:grid-cols-5">
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
              <p className="mb-1 text-xs tracking-[0.25em] text-brown">OWNER</p>
              <h2 className="mb-6 text-2xl text-ink">井上 孝志</h2>
              <h3 className="mb-4 text-lg text-ink">
                疲れを、「年齢のせい」で終わらせたくない。
              </h3>
              <div className="space-y-4 text-sm leading-loose text-charcoal-light">
                <p>
                  30歳を過ぎた頃から、以前なら一晩眠れば戻っていた疲れが、
                  翌朝にも残るようになりました。
                </p>
                <p>
                  体力の低下、崩れていく体型、安定しない肌の調子。気持ちまで少しずつ
                  後ろ向きになり、「年齢を重ねれば、仕方がないのかもしれない」と
                  考えたこともあります。
                </p>
                <p>そんな私を変えたのが、インナービューティーとの出会いでした。</p>
                <p>
                  食事を見直し、身体の内側から整えることで、体重は79.5kgから63kgへ。
                  変わったのは体型だけではありません。肌の調子が整い、疲れを
                  引きずりにくくなり、何より自分自身に前向きになれました。
                </p>
                <p>
                  この経験から実感したのは、人を整えるためには、外側からのケアだけでも、
                  内側からのケアだけでも十分ではないということでした。
                </p>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <h3 className="mb-2 text-lg text-ink">
                頑張ることには慣れていても、休むことには慣れていない。
              </h3>
              <p>
                サロンでお客様と向き合っていると、30代、40代、50代の男性から、
                よく同じような声を聞きます。
              </p>
              <p>
                「パソコンに向かう時間が長く、目や肩がつらい」
                <br />
                「眠っているのに、疲れが抜けた気がしない」
                <br />
                「最近、鏡に映る自分が疲れて見える」
              </p>
              <p>
                仕事や家庭で背負うものが増え、自分のことはいつも後回し。
                身体の変化に気づいていても、「まだ大丈夫」「年齢だから仕方がない」と、
                そのまま頑張り続けてしまう。
              </p>
              <p>私自身も同じ世代だからこそ、その感覚がよく分かります。</p>
              <p>だから私が、15年以上にわたって大切にしてきたのがヘッドスパです。</p>
              <p>
                私にとってヘッドスパは、ただ頭をほぐすための施術ではありません。
              </p>
              <p>
                目を閉じ、身体の力を抜き、誰にも気を遣わずに過ごす。忙しさの中で
                置き去りにしてきた自分自身を、静かに取り戻していく時間です。
              </p>
              <p>
                その日の疲れ方や頭皮の状態は、一人ひとり違います。だからこそ、
                決められた施術を繰り返すのではなく、目の前のお客様の状態を見ながら、
                必要なケアを考えることを大切にしています。
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <h3 className="mb-2 text-lg text-ink">
                メニューを増やしたかったわけではありません。
              </h3>
              <p>
                ヘッドスパを中心に、フェイシャル、シェービング、耳つぼ、痩身、
                インナービューティー。umbrellaには、男性を整えるためのさまざまな
                メニューがあります。
              </p>
              <p>これは、ただ手を広げたかったからではありません。</p>
              <p>
                お客様の悩みに向き合うほど、頭皮だけ、肌だけ、身体だけでは
                解決できないことがあると気づいたからです。
              </p>
              <p>
                疲れは表情に現れ、生活習慣は肌や頭皮にも現れます。外側を整えることで
                気持ちが前向きになり、内側を整えることで、その変化を支えやすくなる。
              </p>
              <p>
                目の前の一人の悩みに、もっと深く応えたい。そう考えて必要なケアを
                一つずつ増やしてきた結果が、今のumbrellaです。
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-paper-dark py-16 md:py-24">
        <Container>
          <FadeIn>
            <div className="mx-auto max-w-2xl space-y-4 text-sm leading-loose text-charcoal-light">
              <h3 className="mb-2 text-lg text-ink">
                まずは、ヘッドスパを受けてほしい。
              </h3>
              <p>
                私自身、40代半ばになった今も、年齢による変化を感じています。
              </p>
              <p>
                年齢を重ねることは止められません。けれど、その変化をただ諦めるのか、
                自分なりに整えながら進んでいくのかは、選べると思っています。
              </p>
              <p>
                美容に詳しくなくても大丈夫です。何を選べばいいのか、
                分からなくても構いません。
              </p>
              <p>
                「疲れを一度リセットしたい」
                <br />
                「もう少し、かっこよくいたい」
                <br />
                「今の自分を変えてみたい」
              </p>
              <p>その気持ちがあれば、十分です。</p>
              <p>
                まずは一度、私が15年以上向き合ってきたヘッドスパを受けてみてください。
              </p>
              <p>
                月に一度、誰かのためではなく、自分自身を整える時間をつくる。
                その時間が、明日からもう一度頑張るための力になれば嬉しく思います。
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Qualifications">
            トータルで相談できる理由
          </SectionHeading>
          <FadeIn>
            <p className="mx-auto mb-8 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              髪・頭皮・肌・身体・内側。それぞれの分野で学び、資格を取得してきました。
              だから、断片的ではなく、あなた全体を見てご提案できます。
            </p>
            <ul className="mx-auto mb-10 grid max-w-2xl gap-3 sm:grid-cols-2">
              {QUALIFICATIONS.map((q) => (
                <li
                  key={q}
                  className="rounded-sm border border-beige bg-paper-dark px-5 py-4 text-center text-sm text-charcoal"
                >
                  {q}
                </li>
              ))}
            </ul>
            <div className="mx-auto max-w-xl space-y-4">
              {CERTIFICATES.map((c) => {
                const img = images[c.slot];
                if (!img) return null;
                return (
                  <CertificateBadge
                    key={c.slot}
                    imageUrl={img.url}
                    imageAlt={img.alt}
                    label={c.label}
                    title={c.title}
                  />
                );
              })}
            </div>
          </FadeIn>
        </Container>
      </section>

      <CtaSection
        settings={settings}
        heading="はじめまして、から始めましょう。"
        body="どんな小さなことでも、LINEでご相談ください。"
        section="about_bottom"
      />
    </>
  );
}
