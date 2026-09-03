"use client";

import { useState, useTransition } from "react";
import { revalidateAll } from "@/app/admin/actions/revalidate";

/** SQLで直接データを変更したときに使う、手動キャッシュ更新ボタン */
export default function RevalidateButton() {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <div className="rounded-sm border border-brown/30 bg-amber-50 p-6">
      <p className="mb-1 font-bold">今すぐサイトを更新する</p>
      <p className="mb-4 text-sm text-charcoal">
        Supabaseで直接データを変更した場合（SQLを実行したときなど）は、
        このボタンを押すと最大1時間待たずにサイトへ反映されます。
        通常の保存フォームを使った場合は自動で反映されるので、押す必要はありません。
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setDone(false);
          startTransition(async () => {
            await revalidateAll();
            setDone(true);
          });
        }}
        className="rounded bg-ink px-6 py-2 text-sm text-white disabled:opacity-50"
      >
        {isPending ? "更新中…" : "今すぐサイトを更新する"}
      </button>
      {done && !isPending && (
        <p className="mt-3 text-sm text-green-700">
          更新しました。サイトを開き直すと反映されています。
        </p>
      )}
    </div>
  );
}
