import SavedBanner from "@/components/admin/SavedBanner";
import { getServerClient } from "@/lib/supabase/server";
import type { Faq } from "@/lib/types";
import { createFaq, deleteFaq, updateFaq } from "../actions/faqs";

function FaqFields({ faq }: { faq?: Faq }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-neutral-500">質問</label>
        <input
          name="question"
          required
          defaultValue={faq?.question ?? ""}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500">回答</label>
        <textarea
          name="answer"
          required
          rows={3}
          defaultValue={faq?.answer ?? ""}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-5 text-sm">
        <label className="flex items-center gap-2">
          カテゴリ
          <input
            name="category"
            defaultValue={faq?.category ?? ""}
            placeholder="初めての方 など"
            className="w-40 rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-2">
          並び順
          <input
            name="sort_order"
            type="number"
            defaultValue={faq?.sort_order ?? 99}
            className="w-16 rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={faq?.is_published ?? true}
          />
          サイトに表示
        </label>
      </div>
    </div>
  );
}

export default async function AdminFaqsPage({
  searchParams,
}: PageProps<"/admin/faqs">) {
  const { saved } = await searchParams;
  const supabase = await getServerClient();
  const { data } = await supabase.from("faqs").select("*").order("sort_order");
  const faqs = (data ?? []) as Faq[];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">よくある質問</h1>
      <SavedBanner show={saved === "1"} />

      <div className="space-y-6">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="rounded-lg border border-neutral-200 bg-white p-5"
          >
            <form action={updateFaq}>
              <input type="hidden" name="id" value={faq.id} />
              <FaqFields faq={faq} />
              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-neutral-900 px-6 py-2 text-sm text-white"
                >
                  保存
                </button>
              </div>
            </form>
            <form action={deleteFaq} className="mt-2">
              <input type="hidden" name="id" value={faq.id} />
              <button
                type="submit"
                className="text-xs text-red-500 hover:underline"
              >
                この質問を削除
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-dashed border-neutral-300 bg-white p-5">
        <h2 className="mb-4 font-bold">新しい質問を追加</h2>
        <form action={createFaq}>
          <FaqFields />
          <button
            type="submit"
            className="mt-4 rounded bg-neutral-900 px-6 py-2 text-sm text-white"
          >
            追加
          </button>
        </form>
      </div>
    </div>
  );
}
