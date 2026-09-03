import { Badge, Card, Empty } from "@/components/admin/board";
import { KNOWLEDGE_CATEGORIES } from "@/lib/admin/knowledge";
import { getServerClient } from "@/lib/supabase/server";
import {
  createKnowledge,
  deleteKnowledge,
  updateKnowledge,
} from "../actions/knowledge";

interface Note {
  id: string;
  title: string;
  body: string;
  category: string;
  updated_at: string;
}

function when(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(iso));
}

const inputClass =
  "w-full rounded-sm border border-beige bg-white px-3 py-2 text-[13px]";

export default async function KnowledgePage() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("knowledge")
    .select("*")
    .order("updated_at", { ascending: false });
  const notes = (data ?? []) as Note[];

  return (
    <div className="space-y-6">
      <div className="border-b border-beige pb-4">
        <p className="mb-1 text-[10px] tracking-[0.2em] text-greige">KNOWLEDGE</p>
        <h1 className="font-serif-jp text-[20px] tracking-wide text-ink">
          ナレッジ
        </h1>
        <p className="mt-1 text-[12.5px] text-charcoal-light">
          気づいたこと、お客様に言われたこと、試してみた結果を残しておく場所です。ここに溜めておくと、投稿案やブログの材料になります。
        </p>
      </div>

      {error && (
        <div className="rounded-sm border border-beige border-l-[3px] border-l-[#a0731f] bg-[#f7f1e4] px-4 py-3 text-[13px] text-[#7a5716]">
          読み取れませんでした。Supabaseでマイグレーション 0024 を実行してください。
        </div>
      )}

      <Card eyebrow="NEW" title="書き足す">
        <form action={createKnowledge} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <input
              name="title"
              required
              placeholder="ひとことで（例：シェービング後の肌の反応を聞かれることが多い）"
              className={inputClass}
            />
            <select name="category" className={inputClass} defaultValue="その他">
              {KNOWLEDGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="body"
            rows={3}
            placeholder="詳しく（任意）"
            className={inputClass}
          />
          <button
            type="submit"
            className="rounded-sm bg-ink px-6 py-2 text-[12px] tracking-wide text-paper"
          >
            追加する
          </button>
        </form>
      </Card>

      <Card eyebrow="NOTES" title="たまっているもの" aside={`${notes.length} 件`}>
        {notes.length === 0 ? (
          <Empty>まだありません。上のフォームから書き足してください。</Empty>
        ) : (
          <div className="space-y-4">
            {notes.map((n) => (
              <details
                key={n.id}
                className="rounded-sm border border-beige bg-white p-4"
              >
                <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                  <Badge>{n.category}</Badge>
                  <span className="flex-1 text-[13px] text-charcoal">
                    {n.title}
                  </span>
                  <span className="text-[11px] tabular-nums text-greige">
                    {when(n.updated_at)}
                  </span>
                </summary>

                <form action={updateKnowledge} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={n.id} />
                  <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
                    <input
                      name="title"
                      required
                      defaultValue={n.title}
                      className={inputClass}
                    />
                    <select
                      name="category"
                      defaultValue={n.category}
                      className={inputClass}
                    >
                      {KNOWLEDGE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    name="body"
                    rows={4}
                    defaultValue={n.body}
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    className="rounded-sm bg-ink px-6 py-2 text-[12px] tracking-wide text-paper"
                  >
                    保存
                  </button>
                </form>

                <form action={deleteKnowledge} className="mt-2">
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    className="text-[11px] text-greige underline underline-offset-4 hover:text-[#8f3826]"
                  >
                    削除する
                  </button>
                </form>
              </details>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
