import {
  ClipboardCheck,
  Droplet,
  Droplets,
  Hand,
  HeartPulse,
  MessageCircle,
  Microscope,
  Moon,
  TrendingUp,
  Waves,
} from "lucide-react";
import CertificateBadge from "@/components/sections/CertificateBadge";
import CtaSection from "@/components/sections/CtaSection";
import EvidenceChart from "@/components/sections/EvidenceChart";
import FlowSteps from "@/components/sections/FlowSteps";
import MenuCard from "@/components/sections/MenuCard";
import PageHero from "@/components/sections/PageHero";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/ui/FadeIn";
import SectionHeading from "@/components/ui/SectionHeading";
import StarRating from "@/components/ui/StarRating";
import { getImages, getMenus, getSettings } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "メンズヘッドスパ",
    description:
      "前橋の男性専用サロンの本格ヘッドスパ。カウンセリング・マイクロスコープでの頭皮診断・施術・肩までのケア・施術後の頭皮確認まで含めた、「気持ちいい」で終わらないヘッドスパです。頭浸浴付きの50分「浄」もご用意。",
    path: "/menu/head-spa",
  });
}

const SPA_FLOW = [
  {
    title: "カウンセリング",
    body: "今日の状態と気になることを伺います。うまく言葉にできなくても大丈夫です。",
    icon: MessageCircle,
  },
  {
    title: "マイクロスコープ診断",
    body: "専用のマイクロスコープで頭皮を拡大し、施術前の状態をモニターで一緒に確認します。",
    icon: Microscope,
  },
  {
    title: "ヘッドスパ施術",
    body: "指の腹と手のひらでリズムをつくり、側頭部・後頭部から首の付け根まで、圧を抜かずに届かせていきます。",
    icon: Hand,
  },
  {
    title: "肩までのケア",
    body: "頭だけで終わらせません。デスクワークで固まった首・肩のこわばりまでほぐします。",
    icon: Waves,
  },
  {
    title: "頭皮の再確認",
    body: "同じマイクロスコープで、施術後の頭皮の変化を一緒に確認します。",
    icon: Microscope,
  },
  {
    title: "アフターカウンセリング",
    body: "ご自宅でのケアや、次回までのペースをご案内します。",
    icon: ClipboardCheck,
  },
];

const SLEEP_STATS = [
  {
    label: "深い睡眠時間",
    value: "最大2.3倍",
    detail: "31分 → 73分（施術当夜）",
    icon: Moon,
  },
  {
    label: "深い睡眠の持続性スコア",
    value: "過去最高 93点",
    detail: "施術前3夜平均70.7点から上昇",
    icon: TrendingUp,
  },
  {
    label: "睡眠時心拍数",
    value: "平均 −5.0bpm",
    detail: "施術後、低下が4日間持続",
    icon: HeartPulse,
  },
];

const SLEEP_DATA = [
  { label: "50代男性", value: 135 },
  { label: "20代女性", value: 133 },
  { label: "50代女性", value: 32 },
  { label: "30代男性", value: 7 },
  { label: "40代女性", value: 0 },
];

const JO_FEATURES = [
  {
    title: "頭浸浴",
    body: "水の流れる音と、体温に近い温かいお湯。アーユルヴェーダの伝統技法シローダーラの発想を取り入れ、オイルの代わりにお湯を頭に注ぎ続けることで、思考を手放す時間をつくります。50分コースだけの工程です。",
    icon: Droplets,
  },
  {
    title: "専用オイル",
    body: "アーユルヴェーダなどでも使われる、エイジングケアに定評のあるオイルを使用。頭皮に浸透させながら、指の腹でじっくりとほぐしていきます。",
    icon: Droplet,
  },
  {
    title: "しっかりとしたマッサージ",
    body: "35分コースより伸びた時間は、表面をなでるためではなく、指の腹で圧を抜かずに芯まで届かせるために使います。",
    icon: Hand,
  },
  {
    title: "静かな空間",
    body: "少し暗めの照明と、歌詞のない音楽。話しかけられることもありません。目を閉じて、ただ身を委ねる時間です。",
    icon: Moon,
  },
];

const VOICES = [
  {
    quote:
      "普通の美容室のヘッドスパより、ずっと本格的でした。頭を触られているうちに、いつの間にか力が抜けていました。",
    person: "40代・男性",
  },
  {
    quote:
      "頭浸浴でお湯が流れる音を聞いていたら、途中から記憶がないくらい寝落ちしていました。仕事の合間に受けたのに、驚くほどリセットされた感覚があります。",
    person: "30代・男性",
  },
  {
    quote:
      "マイクロスコープで自分の頭皮を見せてもらったのは初めてで、正直驚きました。施術後は同じ画面で変化も見られて、納得感がありました。",
    person: "50代・男性",
  },
];

export default async function HeadSpaPage() {
  const [settings, menus, images] = await Promise.all([
    getSettings(),
    getMenus(),
    getImages(),
  ]);
  const spaMenus = menus.filter((m) => m.category === "head_spa");
  const soloMenus = menus.filter((m) => m.category === "head_spa_solo");
  const mimitsubo = menus.find((m) => m.category === "mimitsubo");

  return (
    <>
      <PageHero
        en="Head Spa"
        title="ヘッドスパ"
        lead={
          "「気持ちよかった」で終わらせない。\nカウンセリングからマイクロスコープでの頭皮確認まで含めた、本格的なヘッドスパです。"
        }
        imageUrl={images.head_spa_hero?.url}
        imageAlt={images.head_spa_hero?.alt}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Menu">2つのヘッドスパ</SectionHeading>
          <FadeIn>
            <CertificateBadge
              imageUrl="/images/certificate-headspa.png"
              imageAlt="ヘッドスパニスト養成講座 修了証"
              label="認定資格"
              title="認定ヘッドスパニスト養成講座を修了したスタッフが担当します。"
              className="mb-10"
            />
            <div className="grid gap-6 md:grid-cols-2">
              {spaMenus.map((menu) => (
                <MenuCard key={menu.slug} menu={menu} />
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              「とにかく疲れている」「寝ても疲れが取れた感じがしない」という方には、
              月1回しっかりリセットできる50分の「浄」をおすすめしています。
            </p>
          </FadeIn>
        </Container>
      </section>

      {soloMenus.length > 0 && (
        <section className="bg-paper-dark py-16 md:py-24">
          <Container>
            <SectionHeading en="No Cut">カットの予定がない日も、大歓迎です</SectionHeading>
            <FadeIn>
              <p className="mx-auto mb-8 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
                髪を切る予定がなくても、頭皮とお肌だけをしっかり整えたい日はご利用ください。
                ヘッドスパだけ、フェイシャルと組み合わせて、どちらもお選びいただけます。
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                {soloMenus.map((menu) => (
                  <MenuCard key={menu.slug} menu={menu} />
                ))}
              </div>
            </FadeIn>
          </Container>
        </section>
      )}

      <section className="bg-ink py-16 text-paper md:py-24">
        <Container>
          <SectionHeading en="Jo — 50min" tone="light">
            50分「浄」で行うこと
          </SectionHeading>
          <FadeIn>
            <div className="grid gap-5 sm:grid-cols-2">
              {JO_FEATURES.map((f) => (
                <div key={f.title} className="rounded-sm bg-charcoal p-6">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-beige/40">
                    <f.icon className="h-4 w-4 text-beige" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <p className="mb-2 font-serif-jp text-base text-paper">
                    {f.title}
                  </p>
                  <p className="text-sm leading-loose text-beige">{f.body}</p>
                </div>
              ))}
            </div>
            {/* 動画枠: 施術動画が用意でき次第ここに挿入する */}
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Flow">ヘッドスパの流れ</SectionHeading>
          <FadeIn>
            <div className="mx-auto max-w-2xl">
              <FlowSteps steps={SPA_FLOW} />
            </div>
          </FadeIn>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading en="Data">
            データで見る、「浄」を受けた夜の変化
          </SectionHeading>
          <FadeIn>
            <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-loose text-charcoal-light">
              当サロンでは、市販の睡眠計測デバイスを使ったモニター調査を行いました（5名・延べ35夜、2026年4〜6月）。
              50分の「浄」を受けた夜は、施術前と比べて「深い睡眠」に関する指標に変化が見られたというデータが得られています。
            </p>
            <div className="grid gap-5 sm:grid-cols-3">
              {SLEEP_STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-sm border border-beige bg-paper-dark p-6 text-center"
                >
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brown/10">
                    <s.icon className="h-5 w-5 text-brown" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <p className="mb-2 text-xs tracking-wider text-brown">
                    {s.label}
                  </p>
                  <p className="mb-2 text-2xl font-medium text-ink md:text-3xl">
                    {s.value}
                  </p>
                  <p className="text-xs text-greige">{s.detail}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-loose text-greige">
              ※「浄」を受けた方のモニター調査（5名・延べ35夜）で観察された代表的な変化の例です。学術的な統計検定を行ったものではなく、効果には個人差があります。
            </p>

            <details className="group mx-auto mt-8 max-w-2xl">
              <summary className="cursor-pointer text-center text-xs tracking-wider text-brown [&::-webkit-details-marker]:hidden">
                対象者ごとの詳しいデータを見る
              </summary>
              <div className="mt-6 rounded-sm border border-beige bg-paper-dark p-6 md:p-8">
                <p className="mb-1 text-center font-serif-jp text-sm text-ink">
                  深い睡眠の指標　変化率（施術前夜 → 「浄」施術当夜）
                </p>
                <p className="mb-6 text-center text-xs text-greige">
                  当サロン独自のモニター調査（5名・延べ35夜）
                </p>
                <EvidenceChart data={SLEEP_DATA} />
              </div>
            </details>
          </FadeIn>
        </Container>
      </section>

      <section className="bg-charcoal py-16 text-paper md:py-24">
        <Container>
          <SectionHeading en="Voice" tone="light">
            お客様の声
          </SectionHeading>
          <FadeIn>
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
              {VOICES.map((v) => (
                <figure
                  key={v.person}
                  className="flex flex-col rounded-sm bg-ink p-6 text-center"
                >
                  <StarRating rating={5} className="mb-4" />
                  <blockquote className="mb-4 flex-1 text-sm leading-loose text-beige">
                    「{v.quote}」
                  </blockquote>
                  <figcaption className="text-xs text-greige">
                    {v.person}
                  </figcaption>
                </figure>
              ))}
            </div>
          </FadeIn>
        </Container>
      </section>

      {mimitsubo && (
        <section className="py-16 md:py-24">
          <Container>
            <SectionHeading en="Option">追加ケア：耳つぼセラピー</SectionHeading>
            <FadeIn>
              <div className="mx-auto max-w-xl">
                <MenuCard menu={mimitsubo} />
                <p className="mt-6 text-center text-xs leading-loose text-greige">
                  耳つぼジュエリーではなく、目立ちにくい耳つぼシールを使用します。
                  リラクゼーション・コンディショニングのための追加ケアとして、ヘッドスパとの組み合わせでご利用いただけます。
                </p>
                <CertificateBadge
                  imageUrl="/images/certificate-mimitsubo.jpg"
                  imageAlt="耳つぼセラピープロ養成講座 修了証"
                  label="認定資格"
                  title="日本耳つぼセラピープロ協会® 認定「耳つぼセラピープロ養成講座」修了"
                  className="mt-6"
                />
              </div>
            </FadeIn>
          </Container>
        </section>
      )}

      <CtaSection
        settings={settings}
        heading="月に一度、頭からリセットする。"
        body="初めての方も、LINEからお気軽にご相談ください。"
        section="head_spa_bottom"
        menu="head_spa"
      />
    </>
  );
}
