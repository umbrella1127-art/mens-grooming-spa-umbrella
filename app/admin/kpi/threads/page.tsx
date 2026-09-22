import Link from "next/link";
import { Badge, Card, Empty, Flow } from "@/components/admin/board";
import RunReflections from "@/components/admin/RunReflections";
import { getReflections } from "@/lib/admin/reflections";
import type { Stage, Tone } from "@/lib/admin/board";
import { TEAM_AVATARS } from "@/lib/admin/team-avatars";
import {
  getThreadsData,
  type RosterMember,
  type ThreadsKnowledge,
  type ThreadsTrial,
  type TrialVerdict,
} from "@/lib/admin/threads";

const SEVERITY_TONE: Record<"info" | "warning" | "critical", Tone> = {
  critical: "bad",
  warning: "warn",
  info: "info",
};
const RUN_TONE: Record<"ok" | "partial" | "error", Tone> = {
  ok: "ok",
  partial: "warn",
  error: "bad",
};
const TRIAL_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "下書き", tone: "info" },
  posted: { label: "投稿済み", tone: "ok" },
  failed: { label: "失敗", tone: "bad" },
  skipped: { label: "見送り", tone: "warn" },
};
const JOB_LABEL: Record<string, string> = {
  "threads:research": "リサーチ",
  "threads:validate": "検証",
  "threads:blog": "記事化",
  "threads:care": "点検",
  "threads:library": "知識整理",
  "threads:post1": "投稿1",
  "threads:post2": "投稿2",
  "threads:post3": "投稿3",
  "threads:refresh-token": "トークン更新",
};

function jst(iso: string, withTime = true) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

function Person({ m }: { m: RosterMember }) {
  return (
    <div className="flex gap-3 rounded-sm border border-beige bg-white px-4 py-3">
      {TEAM_AVATARS[m.agent] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={TEAM_AVATARS[m.agent]}
          alt={m.displayName}
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="text-[24px]" aria-hidden>
          {m.icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-serif-jp text-[14px] tracking-wide text-ink">
          {m.displayName}
        </span>
        {m.age !== null && (
          <span className="text-[11px] tabular-nums text-greige">{m.age}歳</span>
        )}
        <span className="text-[11.5px] text-charcoal-light">{m.roleTitle}</span>
        <code className="ml-auto text-[10.5px] text-greige">{m.agent}</code>
      </div>
      {m.personality && (
        <p className="mt-1.5 text-[12px] leading-relaxed text-charcoal">{m.personality}</p>
      )}
      {m.catchphrase && (
        <p className="mt-1 text-[11.5px] leading-relaxed text-greige">「{m.catchphrase}」</p>
      )}
      </div>
    </div>
  );
}

const VERDICT: Record<TrialVerdict, { label: string; tone: Tone }> = {
  win: { label: "反応あり", tone: "ok" },
  lead: { label: "表示が伸びた", tone: "ok" },
  flat: { label: "平均並み", tone: "info" },
  lose: { label: "表示が落ちた", tone: "bad" },
  insufficient: { label: "比較対象不足", tone: "info" },
};
const HIT_LABEL = { hit: "予測どおり", partial: "一部当たり", miss: "予測と逆" } as const;

/** T+7 の確定判定があればそれを、無ければ T+1 の暫定判定を出す */
function TrialJudgement({ t }: { t: ThreadsTrial }) {
  const snap = t.t7 ?? t.t1;
  if (!snap?.verdict) return <span className="text-greige">—</span>;
  const v = VERDICT[snap.verdict];
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge tone={v.tone}>
        {t.t7 ? "確定" : "暫定"}・{v.label}
      </Badge>
      {snap.hit && <span className="text-[11px] text-greige">{HIT_LABEL[snap.hit]}</span>}
      {t.t7?.note && <span className="text-[11px] text-greige">{t.t7.note}</span>}
    </div>
  );
}

const KNOWLEDGE_GROUPS: {
  key: string;
  label: string;
  tone: Tone;
  match: (k: ThreadsKnowledge) => boolean;
}[] = [
  { key: "adopted", label: "採用（再現した型・決めごと）", tone: "ok", match: (k) => k.status === "adopted" && k.kind !== "summary" },
  { key: "candidate", label: "保留（まだ3件未満）", tone: "info", match: (k) => k.status === "candidate" },
  { key: "summary", label: "週次まとめ", tone: "info", match: (k) => k.kind === "summary" },
  { key: "retired", label: "退役（もう使わない）", tone: "warn", match: (k) => k.status === "retired" },
];

export default async function ThreadsKpiPage() {
  const [d, reflections] = await Promise.all([getThreadsData(), getReflections("threads")]);
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
  const todays = d.trials.filter((t) => t.trialDate === today);
  const past = d.trials.filter((t) => t.trialDate !== today);
  const critical = d.issues.filter((i) => i.severity === "critical").length;

  const stages: Stage[] = [
    {
      n: String(d.stock),
      label: "未テストの種ネタ",
      hint: d.stock < 9 ? "9件未満：翌朝に補充" : "在庫あり",
      tone: d.stock < 6 ? "warn" : "ok",
    },
    {
      n: String(todays.length),
      label: "今日の投稿",
      hint: `${todays.filter((t) => t.status === "posted").length}本 投稿済み`,
      tone: todays.length < 3 ? "warn" : "ok",
    },
    {
      n: String(d.winnersWaiting),
      label: "記事化待ちの勝者",
      hint: "翌朝6:30に記事化",
      tone: "info",
    },
    {
      n: String(d.pendingBlogDrafts),
      label: "承認待ちの記事",
      hint: "承認すると公開",
      tone: d.pendingBlogDrafts > 0 ? "warn" : "info",
      href: "/admin/approvals",
    },
    {
      n: String(d.issues.length),
      label: "未解決の異常",
      hint: critical > 0 ? `${critical}件が重要` : "点検は毎朝7:00",
      tone: critical > 0 ? "bad" : d.issues.length > 0 ? "warn" : "ok",
    },
  ];

  const threadsRoster = d.roster.filter((m) => m.channel === "threads");
  const hpbRoster = d.roster.filter((m) => m.channel === "hpb");

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">
          <Link href="/admin/kpi" className="hover:underline">
            KPI
          </Link>{" "}
          / THREADS
        </p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          Threads検証 → 公式ブログ
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          1日3投稿の反応を測り、いちばん良かったテーマだけを翌日ブログにします。記事は承認するまで公開されません。運用ガイド:
          `scripts/threads/GUIDE.md`
        </p>
      </div>

      {!d.available ? (
        <Card eyebrow="STATUS" title="準備中">
          <Empty>
            Threads基盤のテーブルが読み取れません。Supabaseでマイグレーション 0029 と 0030 を実行してください。
          </Empty>
        </Card>
      ) : (
        <>
          <Flow stages={stages} />

          <Card eyebrow="TODAY" title={`今日の3本（${today}）`}>
            {todays.length === 0 ? (
              <Empty>まだ作られていません。毎朝6:00に検証担当が作ります。</Empty>
            ) : (
              <ul className="space-y-3">
                {todays.map((t) => (
                  <li key={t.id} className="border-l-2 border-beige pl-4">
                    <div className="flex flex-wrap items-baseline gap-2 text-[11.5px]">
                      <span className="font-serif-jp text-[13px] text-ink">slot {t.slot}</span>
                      <Badge tone={TRIAL_STATUS[t.status]?.tone ?? "info"}>
                        {TRIAL_STATUS[t.status]?.label ?? t.status}
                      </Badge>
                      {t.hook && <span className="text-greige">{t.hook}</span>}
                      {t.ageBand && <span className="text-greige">{t.ageBand}</span>}
                      {t.pillar && <span className="text-greige">{t.pillar}</span>}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-charcoal">
                      {t.postText}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card eyebrow="RESULTS" title="直近14日の投稿と反応">
            {past.length === 0 ? (
              <Empty>実測はまだありません。投稿の翌朝6:00に反応を取り込みます。</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-beige text-[10.5px] uppercase tracking-wide text-greige">
                      <th className="py-2 pr-3 font-semibold">日付</th>
                      <th className="py-2 pr-3 font-semibold">slot</th>
                      <th className="py-2 pr-3 font-semibold">状態</th>
                      <th className="py-2 pr-3 font-semibold">型</th>
                      <th className="py-2 pr-3 font-semibold">表示 T+1→T+7</th>
                      <th className="py-2 pr-3 font-semibold">反応</th>
                      <th className="py-2 pr-3 font-semibold">判定・予測</th>
                      <th className="py-2 pr-3 font-semibold">投稿文</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map((t) => (
                      <tr
                        key={t.id}
                        className={`border-b border-beige/60 last:border-b-0 ${t.isWinner ? "bg-[#e6ede7]/50" : ""}`}
                      >
                        <td className="py-2 pr-3 align-top tabular-nums">{t.trialDate.slice(5)}</td>
                        <td className="py-2 pr-3 align-top tabular-nums">{t.slot}</td>
                        <td className="py-2 pr-3 align-top">
                          {t.isWinner ? (
                            <Badge tone="ok">勝者</Badge>
                          ) : (
                            <Badge tone={TRIAL_STATUS[t.status]?.tone ?? "info"}>
                              {TRIAL_STATUS[t.status]?.label ?? t.status}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 pr-3 align-top text-charcoal-light">{t.hook ?? "—"}</td>
                        <td className="py-2 pr-3 align-top tabular-nums">
                          {t.t1?.views ?? t.views ?? "—"}
                          {t.t7 && <span className="text-greige"> → {t.t7.views}</span>}
                        </td>
                        <td className="py-2 pr-3 align-top tabular-nums">{t.score ?? "—"}</td>
                        <td className="py-2 pr-3 align-top">
                          <TrialJudgement t={t} />
                        </td>
                        <td className="py-2 pr-3 align-top text-charcoal">
                          <span className="line-clamp-2">{t.postText}</span>
                          {t.resultNote && (
                            <span className="mt-0.5 block text-[11px] text-greige">{t.resultNote}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card eyebrow="ISSUES" title="未解決の異常（点検担当が記録）">
              {d.issues.length === 0 ? (
                <Empty>異常はありません。</Empty>
              ) : (
                <ul className="space-y-2.5">
                  {d.issues.map((i) => (
                    <li key={i.id} className="text-[12.5px]">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <Badge tone={SEVERITY_TONE[i.severity]}>{i.severity}</Badge>
                        <span className="text-charcoal">{i.title}</span>
                        <span className="ml-auto text-[11px] tabular-nums text-greige">
                          {jst(i.detectedAt)}
                        </span>
                      </div>
                      {i.actionTaken && (
                        <p className="mt-0.5 text-[11.5px] text-greige">対応: {i.actionTaken}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card eyebrow="RUNS" title="実行記録（直近）">
              {d.runs.length === 0 ? (
                <Empty>自動実行の記録はまだありません。</Empty>
              ) : (
                <ul className="space-y-2">
                  {d.runs.map((r, idx) => (
                    <li key={idx} className="flex flex-wrap items-baseline gap-2 text-[12.5px]">
                      <span className="tabular-nums text-greige">{jst(r.ranAt)}</span>
                      <Badge tone={RUN_TONE[r.status]}>{JOB_LABEL[r.routine] ?? r.routine}</Badge>
                      <span className="min-w-0 flex-1 truncate text-charcoal">{r.summary}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <RunReflections data={reflections} />

          <Card
            eyebrow="KNOWLEDGE"
            title="効いた型・外れた型"
            aside={
              <Link href="/admin/knowledge" className="underline underline-offset-4">
                ナレッジで編集 →
              </Link>
            }
          >
            {d.knowledge.length === 0 ? (
              <Empty>T+7 の判定が出ると、検証担当が根拠を積み始めます。日曜に知識整理担当が採用・退役を決めます。</Empty>
            ) : (
              <div className="space-y-5">
                <p className="text-[11.5px] leading-relaxed text-greige">
                  型は「保留」で始まり、支持する投稿が3件以上たまって反証より多くなったときだけ「採用」になります。
                  使わなくなった型は消さずに「退役」させ、理由を残します。
                </p>
                {KNOWLEDGE_GROUPS.map((g) => {
                  const items = d.knowledge.filter((k) => g.match(k));
                  if (items.length === 0) return null;
                  return (
                    <section key={g.key} className="space-y-3">
                      <h3 className="text-[12px] tracking-wide text-charcoal-light">
                        {g.label}（{items.length}）
                      </h3>
                      <dl className="space-y-3">
                        {items.map((k) => (
                          <div key={k.id} className="border-l-2 border-beige pl-4">
                            <dt className="flex flex-wrap items-baseline gap-2 text-[13px] text-ink">
                              <Badge tone={g.tone}>{k.category}</Badge>
                              {k.title}
                              {k.kind === "pattern" && (
                                <span className="text-[11px] tabular-nums text-greige">
                                  支持{k.support}・反証{k.contradict}
                                  {k.status === "candidate" && k.support < 3 && `（あと${3 - k.support}件で判定）`}
                                </span>
                              )}
                              <span className="ml-auto text-[11px] text-greige">{jst(k.updatedAt, false)}</span>
                            </dt>
                            {k.status === "retired" ? (
                              <dd className="mt-1 text-[12px] leading-relaxed text-charcoal-light">
                                もう使わない理由: {k.retiredReason}
                              </dd>
                            ) : (
                              <dd className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-charcoal">
                                {k.body}
                              </dd>
                            )}
                          </div>
                        ))}
                      </dl>
                    </section>
                  );
                })}
              </div>
            )}
          </Card>

          <Card eyebrow="TEAM" title="Threads担当（6名）">
            <div className="grid gap-3 md:grid-cols-2">
              {threadsRoster.map((m) => (
                <Person key={m.agent} m={m} />
              ))}
            </div>
          </Card>

          <Card eyebrow="TEAM" title="HPB月次分析の担当（13名）">
            <div className="grid gap-3 md:grid-cols-2">
              {hpbRoster.map((m) => (
                <Person key={m.agent} m={m} />
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
