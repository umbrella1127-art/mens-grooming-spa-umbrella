"use client";

import Link from "next/link";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) {
        setError(`送信できませんでした（${error.message}）`);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-sm border border-beige bg-white p-8">
      <h1 className="mb-6 text-lg font-bold">パスワードの再設定</h1>
      {sent ? (
        <p className="text-sm text-charcoal">
          入力されたメールアドレス宛に、パスワード再設定用のリンクを送信しました。メールを確認してください（届かない場合は迷惑メールフォルダもご確認ください）。
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm" htmlFor="email">
              管理者アカウントのメールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-beige px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-ink py-2.5 text-sm text-white disabled:opacity-50"
          >
            {loading ? "送信中…" : "再設定メールを送る"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-xs">
        <Link href="/admin/login" className="text-charcoal-light underline">
          ログイン画面に戻る
        </Link>
      </p>
    </div>
  );
}
