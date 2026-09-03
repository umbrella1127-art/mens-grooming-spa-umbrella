"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

/**
 * パスワード再設定メールのリンク先。
 * Supabaseがメール内のトークンをもとに、このページ読み込み時に
 * 一時的なセッションをブラウザ側で確立する（PASSWORD_RECOVERYイベント）。
 * middleware側でも未ログインリダイレクトの対象外にしてある。
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = getBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("パスワードは8文字以上で設定してください。");
      return;
    }
    if (password !== confirm) {
      setError("パスワードが一致しません。");
      return;
    }
    setLoading(true);
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        // 原因を切り分けられるようにSupabaseのメッセージをそのまま出す
        setError(`設定できませんでした（${error.message}）`);
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-lg border border-neutral-200 bg-white p-8">
      <h1 className="mb-6 text-lg font-bold">新しいパスワードの設定</h1>
      {done ? (
        <p className="text-sm text-neutral-700">
          パスワードを設定しました。管理画面に移動します…
        </p>
      ) : !ready ? (
        <p className="text-sm text-neutral-500">
          リンクを確認しています。うまく表示されない場合は、メール内のリンクをもう一度開いてください。
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm" htmlFor="password">
              新しいパスワード
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm" htmlFor="confirm">
              新しいパスワード（確認）
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-neutral-900 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {loading ? "設定中…" : "パスワードを設定する"}
          </button>
        </form>
      )}
    </div>
  );
}
