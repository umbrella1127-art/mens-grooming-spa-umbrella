// 稼働タイムライン（/admin/activity）の組み立て。DBを読まない純粋な関数だけを置く（node で直接テストできるように）。
// データの取得は lib/admin/activity.ts。
// 出どころ: agent_runs（Threads・サイト・クラウドの定期実行）/ analysis_runs + agent_tasks（HPB）/
//           run_reflections（振り返り）/ pipeline_issues（異常）/ experiments（サイト改善）

export type SlotState = "running" | "ok" | "partial" | "error" | "stalled" | "waiting" | "planned" | "missing" | "untracked";

/**
 * 定期実行の時間割。実体は scripts/threads/schedule/register-tasks.ps1・scripts/site/register-task.ps1（Windows）、
 * Claude の定期タスク（HPB）、Anthropic クラウドのルーティン。時刻を変えたらここも直す。
 */
interface ScheduleDef {
  time: string; // HH:MM（日本時間）
  routine: string; // agent_runs.routine、HPB は analysis_runs.kind を 'hpb:<kind>' で表す
  label: string;
  team: "サイト" | "Threads" | "HPB" | "企画";
  agent?: string; // agent_roster.agent
  on: (d: JstDay) => boolean;
  untracked?: boolean; // 実行記録を残さない（Discord通知のみ）
}

export interface JstDay {
  iso: string; // YYYY-MM-DD
  dow: number; // 0=日
  day: number;
  month: number;
  lastDay: number;
}

const every = () => true;
const dows = (...d: number[]) => (x: JstDay) => d.includes(x.dow);

/** HPB月号は最終木曜で締まり、その翌日（金曜）に月次分析が走る */
function isClosingFriday(x: JstDay) {
  if (x.dow !== 5) return false;
  // 前日（木曜）がその月の最終木曜か。1日が金曜なら前日は前月の末日＝前月の最終木曜
  return x.day === 1 || x.day - 1 + 7 > x.lastDay;
}

const SCHEDULE: ScheduleDef[] = [
  { time: "04:30", routine: "site:daily", label: "GA4の取り込み・サイト実験の判定", team: "サイト", on: every },
  { time: "05:30", routine: "threads:research", label: "種ネタの補充", team: "Threads", agent: "threads-researcher", on: every },
  { time: "06:00", routine: "threads:validate", label: "答え合わせ（T+1・T+7）と今日の3本", team: "Threads", agent: "threads-strategist", on: every },
  { time: "06:30", routine: "threads:blog", label: "勝者のブログ化", team: "Threads", agent: "threads-blog-writer", on: every },
  { time: "07:00", routine: "threads:care", label: "点検（異常・改善案の仕分け）", team: "Threads", agent: "threads-caretaker", on: every },
  { time: "07:30", routine: "threads:library", label: "週次の知識整理", team: "Threads", agent: "threads-librarian", on: dows(0) },
  { time: "08:00", routine: "threads:post1", label: "Threads 1本目を投稿", team: "Threads", on: every },
  { time: "09:00", routine: "数字の共有リマインド", label: "数字の共有リマインド", team: "企画", on: dows(1, 2) },
  { time: "09:00", routine: "コンテンツ企画（週3）", label: "コンテンツ企画（週3）", team: "企画", on: dows(1, 3, 5) },
  { time: "09:30", routine: "threads:watch", label: "未投稿の見張り", team: "Threads", on: every },
  { time: "10:00", routine: "hpb:monthly", label: "HPB月次分析（締め翌日）", team: "HPB", agent: "hpb-orchestrator", on: isClosingFriday },
  { time: "10:00", routine: "hpb:midcheck", label: "HPB中間チェック", team: "HPB", on: (x) => x.day === 15, untracked: true },
  { time: "10:00", routine: "hpb:ribbon", label: "リボンPDF依頼リマインド", team: "HPB", on: (x) => x.day === 5 && [1, 4, 7, 10].includes(x.month), untracked: true },
  { time: "10:10", routine: "hpb:weekly-page-check", label: "HPB実ページの週次確認", team: "HPB", agent: "hpb-page-scout", on: dows(1) },
  { time: "12:30", routine: "threads:post2", label: "Threads 2本目を投稿", team: "Threads", on: every },
  { time: "14:00", routine: "threads:watch", label: "未投稿の見張り", team: "Threads", on: every },
  { time: "19:00", routine: "threads:post3", label: "Threads 3本目を投稿", team: "Threads", on: every },
  { time: "20:30", routine: "threads:watch", label: "未投稿の見張り", team: "Threads", on: every },
];

export interface Run {
  id: string;
  routine: string;
  status: "running" | "ok" | "partial" | "error";
  startedAt: string | null;
  finishedAt: string | null;
  summary: string | null;
}

export interface Slot {
  time: string;
  label: string;
  team: ScheduleDef["team"];
  agent: RosterLite | null;
  state: SlotState;
  run: Run | null;
  untracked: boolean;
}

export interface RosterLite {
  agent: string;
  name: string;
  role: string;
  icon: string | null;
}

export interface NowItem {
  key: string;
  label: string;
  who: string;
  since: string;
  stalled: boolean;
}

export interface TreeNode {
  key: string;
  label: string;
  status: string;
  at: string | null;
  note: string | null;
  children: TreeNode[];
}

export interface FeedItem {
  key: string;
  at: string;
  kind: "run" | "task" | "reflection" | "issue" | "experiment";
  text: string;
  tone: "info" | "ok" | "warn" | "bad";
}

export interface ActivityData {
  available: boolean;
  today: string;
  generatedAt: string;
  now: NowItem[];
  slots: Slot[];
  extraRuns: Run[];
  trees: TreeNode[];
  feed: FeedItem[];
}

const ROUTINE_LABEL: Record<string, string> = {
  ...Object.fromEntries(SCHEDULE.map((s) => [s.routine, s.label])),
  "hpb:manual_analysis": "HPB 手動の分析",
  "hpb:manual_backfill": "HPB 手動の遡り分析",
  "hpb:backfill": "HPB 分析手法の遡り適用",
  "hpb:adhoc": "HPB 臨時の分析",
  "threads:refresh-token": "Threadsトークンの更新",
};

export function jstDay(date = new Date()): JstDay {
  const iso = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(date);
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { iso, dow, day: d, month: m, lastDay: new Date(Date.UTC(y, m, 0)).getUTCDate() };
}

function slotEpoch(dayIso: string, hhmm: string) {
  return new Date(`${dayIso}T${hhmm}:00+09:00`).getTime();
}

const STALL_MS = 3 * 3_600_000;

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RawActivity {
  runs: any[];
  hpbRuns: any[];
  tasks: any[];
  reflections: any[];
  issues: any[];
  experiments: any[];
  roster: any[];
}

export function buildActivity(raw: RawActivity, nowMs: number): ActivityData {
  const today = jstDay(new Date(nowMs));
  const todayStart = new Date(`${today.iso}T00:00:00+09:00`).toISOString();
  const roster = new Map<string, RosterLite>(
    raw.roster.map((r) => [
      r.agent,
      { agent: r.agent, name: r.display_name, role: r.role_title, icon: r.icon },
    ]),
  );

  const runs: Run[] = raw.runs.map((r) => ({
    id: r.id,
    routine: r.routine,
    status: r.status,
    startedAt: r.started_at,
    finishedAt: r.finished_at ?? (r.status === "running" ? null : r.ran_at),
    summary: r.summary,
  }));
  const runTime = (r: Run) => new Date(r.startedAt ?? r.finishedAt ?? 0).getTime();

  // HPB の実行（analysis_runs）も同じ形に揃える
  const hpbRuns: Run[] = raw.hpbRuns.map((r) => ({
    id: `hpb-${r.id}`,
    routine: `hpb:${r.kind}`,
    status: r.status === "completed" ? "ok" : r.status === "failed" ? "error" : "running",
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    summary: r.summary ?? `${r.month}`,
  }));
  const allRuns = [...runs, ...hpbRuns];

  // ---- 今日の時間割（予定と実際の実行を突き合わせる）
  const todaysRuns = allRuns
    .filter((r) => runTime(r) >= new Date(todayStart).getTime())
    .sort((a, b) => runTime(a) - runTime(b));
  const used = new Set<string>();
  const defs = SCHEDULE.filter((s) => s.on(today)).sort((a, b) => a.time.localeCompare(b.time));
  const slots: Slot[] = defs.map((s, i) => {
    const at = slotEpoch(today.iso, s.time);
    const nextSame = defs.slice(i + 1).find((x) => x.routine === s.routine);
    const until = nextSame ? slotEpoch(today.iso, nextSame.time) - 15 * 60_000 : at + 6 * 3_600_000;
    const run =
      todaysRuns.find(
        (r) => !used.has(r.id) && r.routine === s.routine && runTime(r) >= at - 15 * 60_000 && runTime(r) < until,
      ) ?? null;
    if (run) used.add(run.id);

    let state: SlotState;
    if (run) {
      state = run.status === "running" && nowMs - runTime(run) > STALL_MS ? "stalled" : run.status;
    } else if (s.untracked) {
      state = "untracked";
    } else if (nowMs < at) {
      state = "planned";
    } else if (nowMs < at + 30 * 60_000) {
      state = "waiting";
    } else {
      state = "missing";
    }
    return {
      time: s.time,
      label: s.label,
      team: s.team,
      agent: s.agent ? roster.get(s.agent) ?? null : null,
      state,
      run,
      untracked: !!s.untracked,
    };
  });
  const extraRuns = todaysRuns.filter((r) => !used.has(r.id));

  // ---- いま動いている
  const tasks = raw.tasks;
  const now: NowItem[] = [
    ...allRuns
      .filter((r) => r.status === "running")
      .map((r) => ({
        key: r.id,
        label: ROUTINE_LABEL[r.routine] ?? r.routine,
        who: r.routine.startsWith("hpb:") ? "HPB 統括" : r.routine.split(":")[0],
        since: r.startedAt ?? "",
        stalled: nowMs - runTime(r) > STALL_MS,
      })),
    ...tasks
      .filter((t) => t.status === "running" && t.started_at)
      .map((t) => ({
        key: `task-${t.id}`,
        label: t.role,
        who: roster.get(t.agent)?.name ?? t.agent,
        since: t.started_at as string,
        stalled: nowMs - new Date(t.started_at as string).getTime() > STALL_MS,
      })),
  ];

  // ---- 実行ツリー（今日の Threads 工程＋その振り返り、直近の HPB 実行＋担当ごとの作業）
  const reflections = raw.reflections;
  const trees: TreeNode[] = [];
  const threadsToday = todaysRuns.filter((r) => r.routine.startsWith("threads:") || r.routine === "site:daily");
  if (threadsToday.length > 0) {
    trees.push({
      key: "threads-today",
      label: `今日の定期実行（${today.iso}）`,
      status: threadsToday.some((r) => r.status === "error") ? "error" : threadsToday.some((r) => r.status === "running") ? "running" : "ok",
      at: null,
      note: null,
      children: threadsToday.map((r) => {
        const job = r.routine.split(":")[1];
        const refl = reflections.filter((x) => x.run_ref === `threads:${job}:${today.iso}`);
        return {
          key: r.id,
          label: ROUTINE_LABEL[r.routine] ?? r.routine,
          status: r.status,
          at: r.startedAt ?? r.finishedAt,
          note: r.summary,
          children: refl.map((x) => ({
            key: `refl-${x.id}`,
            label: `振り返り: ${roster.get(x.agent)?.name ?? x.agent}`,
            status: x.rules_ok ? "ok" : "partial",
            at: x.created_at,
            note: x.output_summary,
            children: [],
          })),
        };
      }),
    });
  }
  const lastHpb = raw.hpbRuns[0];
  if (lastHpb) {
    const children = tasks
      .filter((t) => t.run_id === lastHpb.id)
      .sort((a, b) => new Date(a.started_at ?? 0).getTime() - new Date(b.started_at ?? 0).getTime())
      .map((t) => ({
        key: `task-${t.id}`,
        label: `${roster.get(t.agent)?.name ?? t.agent}（${t.role}）`,
        status: t.status === "completed" ? "ok" : t.status === "failed" ? "error" : t.status,
        at: t.started_at,
        note: t.error ?? t.output_note,
        children: [],
      }));
    trees.push({
      key: `hpb-${lastHpb.id}`,
      label: `HPB ${lastHpb.month}（${lastHpb.kind}）`,
      status: lastHpb.status === "completed" ? "ok" : lastHpb.status === "failed" ? "error" : "running",
      at: lastHpb.started_at,
      note: lastHpb.summary,
      children,
    });
  }

  // ---- ログ（直近48時間の出来事を時系列に）
  const feed: FeedItem[] = [];
  for (const r of allRuns) {
    const label = ROUTINE_LABEL[r.routine] ?? r.routine;
    if (r.startedAt && new Date(r.startedAt).getTime() >= nowMs - 48 * 3_600_000) {
      feed.push({ key: `${r.id}-s`, at: r.startedAt, kind: "run", text: `${label} を開始`, tone: "info" });
    }
    if (r.finishedAt && r.status !== "running") {
      feed.push({
        key: `${r.id}-f`,
        at: r.finishedAt,
        kind: "run",
        text: `${label} が${r.status === "ok" ? "完了" : r.status === "partial" ? "一部だけ完了" : "失敗"}${r.summary ? `：${r.summary}` : ""}`,
        tone: r.status === "ok" ? "ok" : r.status === "partial" ? "warn" : "bad",
      });
    }
  }
  for (const t of tasks) {
    const who = roster.get(t.agent)?.name ?? t.agent;
    if (t.finished_at && new Date(t.finished_at).getTime() >= nowMs - 48 * 3_600_000) {
      feed.push({
        key: `task-${t.id}`,
        at: t.finished_at,
        kind: "task",
        text: `${who}（${t.role}）が${t.status === "failed" ? "失敗" : "作業を終えた"}`,
        tone: t.status === "failed" ? "bad" : "ok",
      });
    }
  }
  for (const x of reflections) {
    feed.push({
      key: `refl-${x.id}`,
      at: x.created_at,
      kind: "reflection",
      text: `${roster.get(x.agent)?.name ?? x.agent} が振り返りを記録：${x.output_summary}`,
      tone: x.rules_ok ? "info" : "warn",
    });
  }
  for (const i of raw.issues) {
    feed.push({
      key: `issue-${i.id}`,
      at: i.detected_at,
      kind: "issue",
      text: `点検担当が異常を記録：${i.title}`,
      tone: i.severity === "critical" ? "bad" : "warn",
    });
  }
  // 投稿は定期実行（threads:post1〜3）の完了として出るので、threads_trials からは重ねて出さない
  for (const e of raw.experiments) {
    if (e.measured_at && new Date(e.measured_at).getTime() >= nowMs - 48 * 3_600_000) {
      feed.push({ key: `exp-m-${e.id}`, at: e.measured_at, kind: "experiment", text: `サイト実験 ${e.code} を判定：${e.name}`, tone: "info" });
    }
    if (new Date(e.created_at).getTime() >= nowMs - 48 * 3_600_000) {
      feed.push({ key: `exp-c-${e.id}`, at: e.created_at, kind: "experiment", text: `サイト実験 ${e.code} を登録：${e.name}`, tone: "info" });
    }
  }
  feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    available: true,
    today: today.iso,
    generatedAt: new Date(nowMs).toISOString(),
    now,
    slots,
    extraRuns,
    trees,
    feed: feed.slice(0, 50),
  };
}
