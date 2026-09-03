import ImageUploader from "@/components/admin/ImageUploader";
import { getServerClient } from "@/lib/supabase/server";
import type { ImageSlot } from "@/lib/types";

export default async function AdminImagesPage() {
  const supabase = await getServerClient();
  const { data } = await supabase.from("images").select("*").order("slot_key");
  const slots = (data ?? []) as ImageSlot[];

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold">写真</h1>
      <p className="mb-6 text-sm text-charcoal-light">
        各写真の「画像を差し替える」から新しい写真をアップロードできます。
      </p>

      {slots.length === 0 && (
        <p className="rounded bg-amber-50 p-4 text-sm text-amber-800">
          画像スロットがありません。Supabaseで supabase/seed.sql
          を実行してください。
        </p>
      )}

      <div className="space-y-4">
        {slots.map((slot) => (
          <ImageUploader key={slot.slot_key} slot={slot} />
        ))}
      </div>
    </div>
  );
}
