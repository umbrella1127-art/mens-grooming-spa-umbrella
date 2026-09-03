// サーバー専用（service_role）クライアント。
// Discord Bot連携やスケジュール実行など、ユーザーセッションを介さない
// 信頼済みのサーバー処理からのみ使うこと。ブラウザや公開ページからは
// 絶対に呼ばない（RLSを無視するため）。
import { createClient } from "@supabase/supabase-js";

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
