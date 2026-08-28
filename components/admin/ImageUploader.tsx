"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateImageSlot } from "@/app/admin/actions/images";
import { getBrowserClient } from "@/lib/supabase/client";
import type { ImageSlot } from "@/lib/types";

function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * 画像スロットのアップローダー。
 * クライアントから Supabase Storage へ直接アップロードし（Server Actionの
 * サイズ制限を回避）、URLの差し替えだけ Server Action で行う。
 * 毎回新しいファイル名にすることでCDNキャッシュ問題を避ける。
 */
export default function ImageUploader({ slot }: { slot: ImageSlot }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alt, setAlt] = useState(slot.alt);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      if (file.size > 8 * 1024 * 1024) {
        throw new Error("8MB以下の画像を選んでください");
      }
      const supabase = getBrowserClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${slot.slot_key}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("site-images")
        .upload(path, file, { cacheControl: "31536000" });
      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from("site-images").getPublicUrl(path);
      const dims = await readDimensions(file).catch(() => null);
      await updateImageSlot({
        slot_key: slot.slot_key,
        url: data.publicUrl,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function onSaveAlt() {
    setBusy(true);
    setError(null);
    try {
      await updateImageSlot({
        slot_key: slot.slot_key,
        url: slot.url,
        alt,
        width: slot.width,
        height: slot.height,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-5 rounded-lg border border-neutral-200 bg-white p-4">
      {/* サムネイルは通常のimgで十分（管理画面のため最適化不要） */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slot.url}
        alt=""
        className="h-20 w-28 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-sm font-medium">{slot.label}</p>
        <div className="mb-2 flex items-center gap-2">
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="画像の説明（alt）"
            className="w-full max-w-xs rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={onSaveAlt}
            disabled={busy}
            className="shrink-0 rounded border border-neutral-300 px-3 py-1 text-xs disabled:opacity-50"
          >
            説明を保存
          </button>
        </div>
        <label className="inline-block cursor-pointer rounded bg-neutral-900 px-4 py-1.5 text-xs text-white">
          {busy ? "アップロード中…" : "画像を差し替える"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            disabled={busy}
            className="hidden"
          />
        </label>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
