import SavedBanner from "@/components/admin/SavedBanner";
import { getServerClient } from "@/lib/supabase/server";
import type { Menu } from "@/lib/types";
import { updateMenu } from "../actions/menus";

const CATEGORY_LABELS: Record<string, string> = {
  head_spa: "ヘッドスパ",
  first_grooming: "初回グルーミング",
  facial: "フェイシャル",
  shaving: "シェービング",
  option: "オプション",
  hair_growth: "育毛",
  inner_beauty: "インナービューティー",
  slimming: "メンズ痩身",
  mimitsubo: "耳つぼ",
  gift: "ギフト",
  membership: "メンバーシップ",
};

export default async function AdminMenusPage({
  searchParams,
}: PageProps<"/admin/menus">) {
  const { saved } = await searchParams;
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("menus")
    .select("*")
    .order("category")
    .order("sort_order");
  const menus = (data ?? []) as Menu[];

  const categories = [...new Set(menus.map((m) => m.category))];

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold">メニュー・料金</h1>
      <p className="mb-6 text-sm text-neutral-500">
        価格が決まったら金額を入力して「価格の表示」を「金額を表示」に変更してください。
      </p>
      <SavedBanner show={saved === "1"} />

      {menus.length === 0 && (
        <p className="rounded bg-amber-50 p-4 text-sm text-amber-800">
          メニューがありません。Supabaseで supabase/seed.sql を実行してください。
        </p>
      )}

      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="mb-4 border-b border-neutral-300 pb-2 font-bold">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="space-y-6">
              {menus
                .filter((m) => m.category === category)
                .map((menu) => (
                  <form
                    key={menu.id}
                    action={updateMenu}
                    className="rounded-lg border border-neutral-200 bg-white p-5"
                  >
                    <input type="hidden" name="id" value={menu.id} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-neutral-500">
                          メニュー名
                        </label>
                        <input
                          name="name"
                          defaultValue={menu.name}
                          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-neutral-500">
                            所要時間（分）
                          </label>
                          <input
                            name="duration_min"
                            type="number"
                            defaultValue={menu.duration_min ?? ""}
                            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-neutral-500">
                            価格（円・税込）
                          </label>
                          <input
                            name="price_yen"
                            type="number"
                            defaultValue={menu.price_yen ?? ""}
                            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-neutral-500">
                            価格の表示
                          </label>
                          <select
                            name="price_status"
                            defaultValue={menu.price_status}
                            className="w-full rounded border border-neutral-300 px-2 py-2 text-sm"
                          >
                            <option value="fixed">金額を表示</option>
                            <option value="tbd">「価格未定」と表示</option>
                            <option value="hidden">価格を出さない</option>
                          </select>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs text-neutral-500">
                          説明文
                        </label>
                        <textarea
                          name="description"
                          rows={2}
                          defaultValue={menu.description ?? ""}
                          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-neutral-500">
                          価格の補足（「税込」「オプション」など）
                        </label>
                        <input
                          name="price_note"
                          defaultValue={menu.price_note ?? ""}
                          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex items-end gap-5 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="is_published"
                            defaultChecked={menu.is_published}
                          />
                          サイトに表示
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="is_recommended"
                            defaultChecked={menu.is_recommended}
                          />
                          「おすすめ」を付ける
                        </label>
                        <label className="flex items-center gap-2">
                          並び順
                          <input
                            name="sort_order"
                            type="number"
                            defaultValue={menu.sort_order}
                            className="w-16 rounded border border-neutral-300 px-2 py-1 text-sm"
                          />
                        </label>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="mt-4 rounded bg-neutral-900 px-6 py-2 text-sm text-white"
                    >
                      保存
                    </button>
                  </form>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
