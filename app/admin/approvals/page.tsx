import CopyButton from "@/components/admin/CopyButton";
import { Badge, Card, Empty } from "@/components/admin/board";
import {
  CHANNEL_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  type ChannelType,
  type ContentDraft,
} from "@/lib/admin/board";
import { getServerClient } from "@/lib/supabase/server";
import { approveDraft, rejectDraft } from "../actions/drafts";

/** 各チャンネルの使い道を、迷わないよう画面上に書いておく */
const CHANNEL_NOTE: Record<ChannelType, string> = {
  threads: "承認後、Threadsに手動で投稿します。",
  blog: "承認後、ブログ記事として書き起こします。",
  gbp: "承認後、Googleビジネスプロフィールの「投稿」に貼り付けます。",
};

function daysSince(iso: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000),
  );
}

function when(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function ApprovalsPage() {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("content_drafts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);
  const drafts = (data ?? []) as ContentDraft[];

  const pending = drafts.filter((d) => d.status === "pending");
  const editing = drafts.filter((d) => d.status === "editing");
  const decided = drafts.filter(
    (d) => d.status === "approved" || d.status === "rejected",
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">APPROVAL</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">承認</h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          自動生成された投稿案の可否を決めます。Discordのボタンと同じ操作で、どちらから決めても結果は揃います。
        </p>
      </div>

      <Card
        eyebrow="PENDING"
        title="承認待ち"
        aside={`${pending.length} 件`}
      >
        {pending.length === 0 ? (
          <Empty>承認待ちはありません。</Empty>
        ) : (
          <div className="space-y-4">
            {pending.map((d) => (
              <article
                key={d.id}
                className="rounded-sm border border-beige bg-white p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <Badge>{CHANNEL_LABEL[d.channel_type]}</Badge>
                  <span className="text-[11px] text-greige">
                    {when(d.created_at)}着 ／ {daysSince(d.created_at)}日待ち
                  </span>
                </div>
                <p className="mb-3 text-[10.5px] text-greige">
                  {CHANNEL_NOTE[d.channel_type]}
                </p>
                <p className="mb-4 whitespace-pre-wrap text-[13px] leading-relaxed text-charcoal">
                  {d.content_text}
                </p>
                <div className="flex flex-wrap items-center gap-2 border-t border-beige/60 pt-3">
                  <form action={approveDraft}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      type="submit"
                      className="rounded-sm bg-ink px-5 py-1.5 text-[11.5px] tracking-wide text-paper"
                    >
                      承認する
                    </button>
                  </form>
                  <form action={rejectDraft}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      type="submit"
                      className="rounded-sm border border-beige px-5 py-1.5 text-[11.5px] tracking-wide text-charcoal-light transition-colors hover:bg-paper-dark"
                    >
                      却下する
                    </button>
                  </form>
                  <div className="ml-auto">
                    <CopyButton text={d.content_text} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      {editing.length > 0 && (
        <Card eyebrow="EDITING" title="修正依頼中" aside={`${editing.length} 件`}>
          <div className="space-y-3">
            {editing.map((d) => (
              <div
                key={d.id}
                className="rounded-sm border border-beige bg-white p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <Badge>{CHANNEL_LABEL[d.channel_type]}</Badge>
                  <span className="text-[11px] text-greige">
                    {when(d.updated_at)}に依頼
                  </span>
                </div>
                {d.edit_note && (
                  <p className="mb-2 border-l-2 border-brown pl-3 text-[12.5px] leading-relaxed text-charcoal">
                    {d.edit_note}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-charcoal-light">
                  {d.content_text}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card eyebrow="DECIDED" title="決定済み" aside="直近60件から">
        {decided.length === 0 ? (
          <Empty>まだありません。</Empty>
        ) : (
          <ul className="divide-y divide-beige/60">
            {decided.map((d) => (
              <li key={d.id} className="flex flex-wrap gap-x-3 gap-y-1 py-2.5">
                <Badge>{CHANNEL_LABEL[d.channel_type]}</Badge>
                <Badge tone={STATUS_TONE[d.status]}>
                  {STATUS_LABEL[d.status]}
                </Badge>
                <p className="w-full flex-1 text-[12.5px] leading-relaxed text-charcoal sm:w-auto">
                  {d.content_text.replace(/\s+/g, " ").slice(0, 70)}
                  {d.content_text.length > 70 ? "…" : ""}
                </p>
                <span className="shrink-0 text-[11px] tabular-nums text-greige">
                  {when(d.updated_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
