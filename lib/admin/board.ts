// 管理画面「業務ボード」用のデータ取得と判定ロジック。
// 画面はこのモジュールが返した結果を並べるだけにして、
// 「何を詰まりとみなすか」の閾値をここに集約する。
import { getServerClient } from "@/lib/supabase/server";

export type Tone = "info" | "ok" | "warn" | "bad";

export type ChannelType = "threads" | "blog" | "gbp";
export type DraftStatus = "pending" | "approved" | "rejected" | "editing";

export interface ContentDraft {
  id: string;
  channel_type: ChannelType;
  content_text: string;
  status: DraftStatus;
  edit_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stage {
  n: string;
  label: string;
  hint: string;
  tone: Tone;
  href?: string;
}

export interface BoardAlert {
  tone: "warn" | "bad";
  text: string;
  href?: string;
}

export interface DraftRow {
  id: string;
  channel: ChannelType;
  status: DraftStatus;
  text: string;
  days: number;
  at: string;
}

export interface PostRow {
  id: string;
  title: string;
  days: number;
}

export interface BoardData {
  today: string;
  draftsAvailable: boolean;
  stages: Stage[];
  alerts: BoardAlert[];
  pendingDrafts: DraftRow[];
  draftPosts: PostRow[];
  recentDrafts: DraftRow[];
  activity: { label: string; value: number }[];
}

export const CHANNEL_LABEL: Record<ChannelType, string> = {
  threads: "Threads",
  blog: "ブログ",
  gbp: "GBP",
};

export const STATUS_LABEL: Record<DraftStatus, string> = {
  pending: "承認待ち",
  approved: "承認済み",
  rejected: "却下",
  editing: "修正依頼中",
};

export const STATUS_TONE: Record<DraftStatus, Tone> = {
  pending: "warn",
  approved: "ok",
  rejected: "info",
  editing: "info",
};

const DAY = 86_400_000;

function daysSince(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / DAY));
}

function jstDate(now: Date): string {
  const f = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  return f.format(now);
}

function jstDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function head(text: string, len = 60): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > len ? `${flat.slice(0, len)}…` : flat;
}

export async function getBoardData(): Promise<BoardData> {
  const supabase = await getServerClient();
  const nowDate = new Date();
  const now = nowDate.getTime();

  const [draftsRes, postsRes, menusRes, imagesRes, settingsRes] =
    await Promise.all([
      supabase
        .from("content_drafts")
        .select(
          "id, channel_type, content_text, status, edit_note, created_at, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("posts")
        .select("id, title, status, updated_at, published_at")
        .order("updated_at", { ascending: false }),
      supabase.from("menus").select("id, name, price_status, is_published"),
      supabase.from("images").select("slot_key, url, label"),
      supabase.from("site_settings").select("key, value"),
    ]);

  // マイグレーション未適用やRLSで読めない場合は「取得できない」扱いにする
  const draftsAvailable = !draftsRes.error;
  const drafts = (draftsRes.data ?? []) as ContentDraft[];
  const posts = (postsRes.data ?? []) as {
    id: string;
    title: string;
    status: "draft" | "published";
    updated_at: string;
    published_at: string | null;
  }[];
  const menus = (menusRes.data ?? []) as {
    id: string;
    name: string;
    price_status: string;
    is_published: boolean;
  }[];
  const images = (imagesRes.data ?? []) as {
    slot_key: string;
    url: string;
    label: string;
  }[];
  const settings = (settingsRes.data ?? []) as {
    key: string;
    value: { text?: string } | null;
  }[];

  const byStatus = (s: DraftStatus) => drafts.filter((d) => d.status === s);
  const pending = byStatus("pending");
  const editing = byStatus("editing");
  const approved = byStatus("approved");

  const oldestPendingDays = pending.length
    ? Math.max(...pending.map((d) => daysSince(d.created_at, now)))
    : 0;
  const oldestEditingDays = editing.length
    ? Math.max(...editing.map((d) => daysSince(d.updated_at, now)))
    : 0;

  const draftPostsAll = posts.filter((p) => p.status === "draft");
  const publishedPosts = posts.filter((p) => p.status === "published");
  const publishedLast30 = publishedPosts.filter(
    (p) => p.published_at && daysSince(p.published_at, now) <= 30,
  ).length;
  const oldestDraftPostDays = draftPostsAll.length
    ? Math.max(...draftPostsAll.map((p) => daysSince(p.updated_at, now)))
    : 0;

  const approvedLast7 = approved.filter(
    (d) => daysSince(d.updated_at, now) <= 7,
  ).length;
  const lastDraftDays = drafts.length
    ? daysSince(drafts[0].created_at, now)
    : null;

  // ── ファネル ──────────────────────────────
  const stages: Stage[] = [
    {
      n: String(pending.length),
      label: "承認待ち",
      hint:
        pending.length === 0
          ? "たまっていません"
          : `いちばん古いもので ${oldestPendingDays}日待ち`,
      tone:
        pending.length === 0
          ? "ok"
          : oldestPendingDays >= 1
            ? "bad"
            : "info",
    },
    {
      n: String(editing.length),
      label: "修正依頼中",
      hint:
        editing.length === 0
          ? "直し待ちはありません"
          : `最長 ${oldestEditingDays}日 反映待ち`,
      tone: oldestEditingDays >= 3 ? "warn" : "info",
    },
    {
      n: String(approved.length),
      label: "ネタ在庫",
      hint: `直近7日で ${approvedLast7} 件承認`,
      tone: approved.length < 3 ? "warn" : "info",
    },
    {
      n: String(draftPostsAll.length),
      label: "ブログ下書き",
      hint:
        draftPostsAll.length === 0
          ? "書きかけはありません"
          : `最長 ${oldestDraftPostDays}日 放置`,
      tone: oldestDraftPostDays >= 30 ? "warn" : "info",
      href: "/admin/posts",
    },
    {
      n: String(publishedPosts.length),
      label: "公開済み",
      hint: `直近30日 ${publishedLast30} 件`,
      tone: "ok",
      href: "/admin/posts",
    },
  ];

  // ── アラート（詰まっている事象だけ） ────────────
  const alerts: BoardAlert[] = [];

  if (!draftsAvailable) {
    alerts.push({
      tone: "warn",
      text: "下書きテーブル（content_drafts）が読み取れません。Supabaseでマイグレーション 0022 を実行してください。",
    });
  }

  if (pending.length > 0 && oldestPendingDays >= 1) {
    alerts.push({
      tone: "bad",
      text: `承認待ちの下書きが ${pending.length}件（最長 ${oldestPendingDays}日）止まっています。Discordで承認・修正・却下してください。`,
    });
  }

  if (editing.length > 0 && oldestEditingDays >= 3) {
    alerts.push({
      tone: "warn",
      text: `修正依頼を出したまま ${editing.length}件 が ${oldestEditingDays}日 動いていません。`,
    });
  }

  if (draftsAvailable && lastDraftDays !== null && lastDraftDays >= 7) {
    alerts.push({
      tone: "warn",
      text: `新しい下書きが ${lastDraftDays}日 届いていません。週3回のスケジュール実行が止まっている可能性があります。`,
    });
  }

  const tbdMenus = menus.filter(
    (m) => m.is_published && m.price_status === "tbd",
  );
  if (tbdMenus.length > 0) {
    alerts.push({
      tone: "warn",
      text: `価格が「未定」のまま公開中のメニューが ${tbdMenus.length}件あります。`,
      href: "/admin/menus",
    });
  }

  const emptyImages = images.filter(
    (i) => !i.url || /placeholder/i.test(i.url),
  );
  if (emptyImages.length > 0) {
    alerts.push({
      tone: "warn",
      text: `写真が未設定のところが ${emptyImages.length}件あります（${emptyImages
        .slice(0, 3)
        .map((i) => i.label)
        .join("・")}${emptyImages.length > 3 ? " ほか" : ""}）。`,
      href: "/admin/images",
    });
  }

  const lineUrl =
    settings.find((s) => s.key === "line_url")?.value?.text ?? "";
  if (!lineUrl || /placeholder/i.test(lineUrl)) {
    alerts.push({
      tone: "bad",
      text: "LINEのURLが仮のままです。実際の公式LINEのURLに変えてください（サイト全体のCTAが繋がりません）。",
      href: "/admin/settings",
    });
  }

  if (draftPostsAll.length > 0 && oldestDraftPostDays >= 30) {
    alerts.push({
      tone: "warn",
      text: `ブログの下書きが ${oldestDraftPostDays}日 放置されています。`,
      href: "/admin/posts",
    });
  }

  // ── 一覧 ────────────────────────────────
  const toRow = (d: ContentDraft): DraftRow => ({
    id: d.id,
    channel: d.channel_type,
    status: d.status,
    text: head(d.content_text),
    days: daysSince(d.created_at, now),
    at: jstDateTime(d.created_at),
  });

  return {
    today: jstDate(nowDate),
    draftsAvailable,
    stages,
    alerts,
    pendingDrafts: pending.slice(0, 8).map(toRow),
    draftPosts: draftPostsAll.slice(0, 8).map((p) => ({
      id: p.id,
      title: p.title,
      days: daysSince(p.updated_at, now),
    })),
    recentDrafts: drafts.slice(0, 12).map(toRow),
    activity: [
      { label: "承認待ち", value: pending.length },
      { label: "承認済み", value: approved.length },
      { label: "修正依頼中", value: editing.length },
      { label: "却下", value: byStatus("rejected").length },
    ],
  };
}
