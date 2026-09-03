// 自動化の体制表。スケジュール実行のルーティン設定と対になっているので、
// ルーティンのプロンプトを変えたらこのファイルも合わせて更新すること。
// ルーティンID: trig_01MgoXbQFiCZ1kLvjDA5wZA6

export interface Member {
  name: string;
  role: string;
  detail: string;
  outputs: string;
}

export interface Unit {
  label: string;
  lead: Member;
  members: Member[];
}

export const SCHEDULE = {
  name: "umbrella コンテンツ企画（週3・オーケストレーション）",
  cron: "毎週 月・水・金 9:00（日本時間）",
  model: "claude-sonnet-5",
  where: "Anthropicのクラウド上（この店のPCは使いません）",
};

export const ORCHESTRATOR: Member = {
  name: "オーケストレーター",
  role: "全体の進行役",
  detail:
    "AGENTS.md のブランド絶対ルール（医療的断定表現の禁止、煽り禁止、電話番号非掲載など）を読み込み、各担当に要約して渡します。直近の下書きも確認して、同じネタが続かないようにします。自分では本文を書きません。",
  outputs: "調査と執筆の割り振り、Discordへの送信、重複チェック",
};

export const UNITS: Unit[] = [
  {
    label: "調査",
    lead: {
      name: "リサーチ担当",
      role: "悩み・検索語を調べる",
      detail:
        "ラッコキーワードと一般のWeb検索だけを使い、35〜50代男性が実際に検索している言葉と悩みを集めます。有料APIやXの直接検索は使いません。文章は書きません。",
      outputs: "悩み・検索フレーズ・文脈の箇条書き",
    },
    members: [],
  },
  {
    label: "執筆（3人が同時に動きます）",
    lead: {
      name: "Threads担当",
      role: "Threads投稿案を1本",
      detail:
        "調査で出てきた悩みに共感し、ヘッドスパ・頭皮・フェイシャル・シェービング・疲労ケアへ軽くつなげます。宣伝色は抑えめ。",
      outputs: "300字前後の投稿文",
    },
    members: [
      {
        name: "ブログ担当",
        role: "記事テーマ案を1本",
        detail:
          "狙うSEOキーワードが分かる形で、タイトル案と3〜4行の切り口・構成メモをまとめます。",
        outputs: "タイトル案＋構成メモ",
      },
      {
        name: "GBP担当",
        role: "Googleビジネスプロフィール投稿文を1本",
        detail:
          "最後に公式LINEへの軽い誘導を入れます。電話番号・煽り文句・医療的断定表現は使いません。",
        outputs: "400〜700字の投稿文",
      },
    ],
  },
];

export const FLOW = [
  {
    step: "1",
    title: "ルールの読み込み",
    body: "AGENTS.md のブランド絶対ルールと、直近2週間の下書きを確認します。",
    by: "オーケストレーター",
  },
  {
    step: "2",
    title: "調査",
    body: "ターゲット層が実際に検索していること・悩んでいることを調べます。",
    by: "リサーチ担当",
  },
  {
    step: "3",
    title: "執筆",
    body: "Threads・ブログ・GBPの3本を、それぞれの担当が同時に書きます。",
    by: "執筆3人",
  },
  {
    step: "4",
    title: "保存と通知",
    body: "3本を下書きとして保存し、承認・修正・却下ボタン付きでDiscordに送ります。",
    by: "オーケストレーター",
  },
  {
    step: "5",
    title: "可否の判断",
    body: "Discordのボタン、または管理画面の「承認」ページで決めます。ここだけが人の仕事です。",
    by: "オーナー",
  },
];

export const HUMAN_TASKS = [
  "届いた3本の承認・修正・却下（Discord または 承認ページ）",
  "承認したGBP投稿文を、Googleビジネスプロフィールに貼り付ける",
  "承認したThreads投稿案を、Threadsに投稿する",
  "承認したブログテーマをもとに、記事を書いて公開する",
];
