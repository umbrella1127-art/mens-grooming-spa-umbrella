import SavedBanner from "@/components/admin/SavedBanner";
import { getServerClient } from "@/lib/supabase/server";
import type { SettingRow } from "@/lib/types";
import { saveSettings } from "../actions/settings";

const GROUP_LABELS: Record<string, string> = {
  fv: "トップのキャッチコピー",
  cta: "CTA（ボタン文言）",
  line: "LINE",
  hours: "営業時間・定休日",
  shop: "店舗情報",
  gift: "ギフト",
};

const GROUP_ORDER = ["fv", "cta", "line", "hours", "shop", "gift"];

export default async function AdminSettingsPage({
  searchParams,
}: PageProps<"/admin/settings">) {
  const { saved } = await searchParams;
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .order("sort_order");
  const rows = (data ?? []) as SettingRow[];

  const groups = GROUP_ORDER.filter((g) =>
    rows.some((r) => r.group_name === g),
  );

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold">サイト設定</h1>
      <p className="mb-6 text-sm text-neutral-500">
        各項目を編集して「保存」を押してください。
      </p>
      <SavedBanner show={saved === "1"} />

      {rows.length === 0 && (
        <p className="rounded bg-amber-50 p-4 text-sm text-amber-800">
          設定データがありません。Supabaseで supabase/seed.sql
          を実行してください。
        </p>
      )}

      <div className="space-y-8">
        {groups.map((group) => (
          <form
            key={group}
            action={saveSettings}
            id={group}
            className="rounded-lg border border-neutral-200 bg-white p-6"
          >
            <h2 className="mb-5 font-bold">{GROUP_LABELS[group] ?? group}</h2>
            <div className="space-y-4">
              {rows
                .filter((r) => r.group_name === group)
                .map((row) => (
                  <div key={row.key}>
                    <label
                      htmlFor={row.key}
                      className="mb-1 block text-sm text-neutral-600"
                    >
                      {row.label}
                    </label>
                    {row.input_type === "textarea" ? (
                      <textarea
                        id={row.key}
                        name={row.key}
                        rows={3}
                        defaultValue={row.value?.text ?? ""}
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        id={row.key}
                        name={row.key}
                        type={row.input_type === "url" ? "url" : "text"}
                        defaultValue={row.value?.text ?? ""}
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                ))}
            </div>
            <button
              type="submit"
              className="mt-5 rounded bg-neutral-900 px-6 py-2 text-sm text-white"
            >
              保存
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
