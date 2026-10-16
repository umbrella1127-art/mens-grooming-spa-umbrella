// Threads アカウント全体の推移と、そこから機械的に出す「気づき」（閲覧のみ）。
// 書き込みは scripts/threads/threads_api.py account-daily（毎朝5:50）。スキーマ: 0040_threads_account.sql
// 「1日」は Threads API の区切りで、日本時間の前日16時〜当日16時。
import { getServerClient } from "@/lib/supabase/server";
import type { Tone } from "@/lib/admin/board";

export interface AccountDay {
  day: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  posts: number;
  followers: number | null;
}

export interface LinkClicks {
  url: string;
  clicks: number;
}

export interface AccountInsight {
  tone: Tone;
  title: string;
  evidence: string;
  suggestion: string;
}

export interface AccountSummary {
  /** 直近30日 */
  views: number;
  prevViews: number;
  reactions: number;
  posts: number;
  postDays: number;
  linkClicks: number;
}

export interface ThreadsAccountData {
  available: boolean;
  days: AccountDay[];
  links: LinkClicks[];
  followers: number | null;
  summary: AccountSummary;
  insights: AccountInsight[];
  fetchedAt: string | null;
}

const WINDOW = 30;
const FOLLOWERS_FOR_DEMOGRAPHICS = 100;

const reactionsOf = (d: AccountDay) => d.likes + d.replies + d.reposts + d.quotes;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
/** 運用を始める前（最初の投稿より前）の日は「投稿しなかった日」に数えない */
const sinceFirstPost = (days: AccountDay[]) => {
  const i = days.findIndex((d) => d.posts > 0 || d.views > 0);
  return i < 0 ? [] : days.slice(i);
};
const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;

/** 数字から決まった型で気づきを出す。言い切れない程度の件数のときは控えめに書く */
export function buildInsights(
  days: AccountDay[],
  links: LinkClicks[],
  followers: number | null,
): AccountInsight[] {
  const out: AccountInsight[] = [];
  const recent = sinceFirstPost(days).slice(-WINDOW);
  if (recent.length === 0) return out;
  const views = sum(recent.map((d) => d.views));

  // 1. 投稿しなかった日は表示が止まる
  const noPost = recent.filter((d) => d.posts === 0);
  const withPost = recent.filter((d) => d.posts > 0);
  if (noPost.length >= 2 && withPost.length >= 3) {
    const avgNo = sum(noPost.map((d) => d.views)) / noPost.length;
    const avgWith = sum(withPost.map((d) => d.views)) / withPost.length;
    if (avgWith > 0 && avgNo < avgWith * 0.2) {
      out.push({
        tone: "warn",
        title: "投稿しなかった日は、表示がほぼ止まっています",
        evidence: `直近${recent.length}日のうち${noPost.length}日が投稿0本。その日の表示は平均${Math.round(avgNo)}回で、投稿した日（平均${Math.round(avgWith)}回）の${Math.round((avgNo / avgWith) * 100)}%でした。過去の投稿が後から読まれる流れはまだ無く、表示は「その日に出したかどうか」でほぼ決まっています。`,
        suggestion:
          "まず毎日1本は必ず出ることを優先する。投稿が止まった日（失敗・承認待ちのまま・下書き不足）の原因を点検の記録で確かめ、止まらない仕組みを先に直す。",
      });
    }
  }

  // 2. 1本あたりの表示の伸び・落ち（直近7日と、その前の7日）
  const last7 = days.slice(-7);
  const prev7 = days.slice(-14, -7);
  const perPost = (ds: AccountDay[]) => {
    const p = sum(ds.map((d) => d.posts));
    return p > 0 ? sum(ds.map((d) => d.views)) / p : null;
  };
  const a = perPost(last7);
  const b = perPost(prev7);
  if (a !== null && b !== null && b > 0) {
    const ratio = a / b;
    if (ratio <= 0.7 || ratio >= 1.3) {
      const up = ratio >= 1.3;
      out.push({
        tone: up ? "ok" : "warn",
        title: up ? "1本あたりの表示が伸びています" : "1本あたりの表示が落ちています",
        evidence: `1本あたりの表示は 直近7日 ${Math.round(a)}回 ／ その前の7日 ${Math.round(b)}回（${Math.round(ratio * 100)}%）。`,
        suggestion: up
          ? "直近7日の投稿の型・タグ・時間帯を「直近14日の投稿と反応」で見比べ、伸びた共通点を検証担当の知識に残す。"
          : "投稿数を増やす前に、直近7日で使った型・タグが前の週と変わっていないかを見る。同じ型が続いているなら、保留中の別の型を1枠だけ試す。",
      });
    }
  }

  // 3. 表示が突出した日
  const viewed = recent.filter((d) => d.views > 0);
  const med = median(viewed.map((d) => d.views));
  const top = [...viewed].sort((x, y) => y.views - x.views)[0];
  if (top && viewed.length >= 5 && med > 0 && top.views >= med * 2.5) {
    out.push({
      tone: "info",
      title: `${md(top.day)} の表示が突出しています`,
      evidence: `${md(top.day)}は${top.views}回で、表示があった日の中央値（${Math.round(med)}回）の${(top.views / med).toFixed(1)}倍でした。`,
      suggestion:
        "その日に出た投稿（前日19時と当日8時・12時半の枠）を表の中で確かめ、テーマ・書き出し・タグのどれが効いたのかを1つに絞って次の週に同じ形で再現する。",
    });
  }

  // 4. 表示はあるのにリンクが押されていない
  const clicks = sum(links.map((l) => l.clicks));
  if (views >= 500 && clicks === 0) {
    out.push({
      tone: "warn",
      title: "表示はあるのに、リンクが1回も押されていません",
      evidence: `直近${recent.length}日で表示${views.toLocaleString()}回に対し、プロフィール等のリンクのクリックは0回（${links.length}件のリンクすべて）。`,
      suggestion:
        "投稿の中に「プロフィールを見に行く理由」が無い可能性が高い。まずは記事化した日の投稿に公式ブログへの一言を添えて、クリックが動くかを見る。あわせて、プロフィールのリンク先が予約までたどれるページになっているかを確かめる。",
    });
  } else if (clicks > 0 && views > 0) {
    out.push({
      tone: "info",
      title: "リンククリックが出ています",
      evidence: `直近${recent.length}日で${clicks}回（表示1,000回あたり${((clicks / views) * 1000).toFixed(1)}回）。内訳は下の表。`,
      suggestion: "クリックが出た日の投稿を確かめ、どのテーマの日にサイトへ流れたかを知識に残す。",
    });
  }

  // 5. 反応（いいね・返信・再投稿・引用）
  const reactions = sum(recent.map(reactionsOf));
  const replies = sum(recent.map((d) => d.replies));
  if (views >= 500) {
    const per1k = (reactions / views) * 1000;
    if (per1k < 10) {
      out.push({
        tone: "warn",
        title: "読まれても、反応がほとんど付いていません",
        evidence: `直近${recent.length}日の反応は${reactions}件（表示1,000回あたり${per1k.toFixed(1)}件）。返信は${replies}件。`,
        suggestion:
          "共感だけで終わる投稿が多い可能性。週に数本、最後を「みなさんはどうしてますか？」のような答えやすい問いで終える型を試し、返信が付くかを確かめる。",
      });
    }
  }

  // 6. フォロワー
  if (followers !== null && followers < FOLLOWERS_FOR_DEMOGRAPHICS) {
    out.push({
      tone: followers === 0 ? "warn" : "info",
      title:
        followers === 0
          ? "フォロワーがまだ0人です（見た人が次も見る理由が無い）"
          : `フォロワーは${followers}人です`,
      evidence: `フォロワーの年齢・地域は${FOLLOWERS_FOR_DEMOGRAPHICS}人を超えるまで Threads が出しません。今は表示がその日のおすすめ表示頼みです。`,
      suggestion:
        "誰が書いているか（井上さん本人）が分かる投稿を週に数本混ぜ、同じ人の続きを読みたくなる形にする。曜日ごとのシリーズ化も候補。",
    });
  }

  return out;
}

export async function getThreadsAccountData(): Promise<ThreadsAccountData> {
  const empty: ThreadsAccountData = {
    available: false,
    days: [],
    links: [],
    followers: null,
    summary: { views: 0, prevViews: 0, reactions: 0, posts: 0, postDays: 0, linkClicks: 0 },
    insights: [],
    fetchedAt: null,
  };
  const supabase = await getServerClient();
  const since = new Date(Date.now() - (WINDOW * 2 + 2) * 86400_000).toISOString().slice(0, 10);
  const [daysRes, linksRes] = await Promise.all([
    supabase
      .from("threads_account_daily")
      .select("day, views, likes, replies, reposts, quotes, posts, followers_count, fetched_at")
      .gte("day", since)
      .order("day", { ascending: true }),
    supabase.from("threads_link_clicks_daily").select("day, link_url, clicks").gte("day", since),
  ]);
  if (daysRes.error || !daysRes.data) return empty;

  const all: AccountDay[] = sinceFirstPost(daysRes.data.map((r) => ({
    day: r.day as string,
    views: r.views ?? 0,
    likes: r.likes ?? 0,
    replies: r.replies ?? 0,
    reposts: r.reposts ?? 0,
    quotes: r.quotes ?? 0,
    posts: r.posts ?? 0,
    followers: r.followers_count,
  })));
  if (all.length === 0) return { ...empty, available: true };

  const days = all.slice(-WINDOW);
  const prev = all.slice(-WINDOW * 2, -WINDOW);
  const from = days[0].day;
  const byUrl = new Map<string, number>();
  for (const r of linksRes.data ?? []) {
    if ((r.day as string) < from) continue;
    byUrl.set(r.link_url as string, (byUrl.get(r.link_url as string) ?? 0) + (r.clicks ?? 0));
  }
  const links = [...byUrl].map(([url, clicks]) => ({ url, clicks })).sort((x, y) => y.clicks - x.clicks);
  const followers = [...all].reverse().find((d) => d.followers !== null)?.followers ?? null;
  const fetchedAt = daysRes.data.reduce<string | null>(
    (m, r) => (!m || (r.fetched_at as string) > m ? (r.fetched_at as string) : m),
    null,
  );

  return {
    available: true,
    days,
    links,
    followers,
    summary: {
      views: sum(days.map((d) => d.views)),
      prevViews: prev.length === WINDOW ? sum(prev.map((d) => d.views)) : 0,
      reactions: sum(days.map(reactionsOf)),
      posts: sum(days.map((d) => d.posts)),
      postDays: days.filter((d) => d.posts > 0).length,
      linkClicks: sum(links.map((l) => l.clicks)),
    },
    insights: buildInsights(days, links, followers),
    fetchedAt,
  };
}
