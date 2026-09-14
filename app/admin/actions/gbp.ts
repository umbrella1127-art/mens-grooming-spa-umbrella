"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GBP_METRICS } from "@/lib/admin/gbp";
import { requireAdmin } from "./helpers";

/**
 * GBP(Googleビジネスプロフィール)の月次実績を手入力で保存する。
 * 自動取得APIが使えないため、オーナーがGBPインサイト画面の数字を転記する運用。
 */
export async function saveGbpMonth(formData: FormData) {
  const supabase = await requireAdmin();

  const storeCode = String(formData.get("store") ?? "");
  const month = String(formData.get("month") ?? "");
  if (!storeCode || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("店舗・月号(YYYY-MM)を正しく指定してください");
  }

  for (const { key } of GBP_METRICS) {
    const raw = formData.get(key);
    if (raw === null || raw === "") continue;
    const value = Number(raw);
    if (Number.isNaN(value)) continue;

    const { error } = await supabase.from("channel_metrics").upsert(
      {
        store: storeCode,
        channel: "gbp",
        month,
        metric: key,
        value,
        source: "manual",
      },
      { onConflict: "store,channel,month,metric" },
    );
    if (error) throw new Error(`保存に失敗しました: ${key} (${error.message})`);
  }

  revalidatePath("/admin/gbp");
  redirect("/admin/gbp?saved=1");
}
