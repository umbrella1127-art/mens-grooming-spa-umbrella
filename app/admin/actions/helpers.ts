"use server";

import { getServerClient } from "@/lib/supabase/server";

/** 認証済みクライアントを返す。未ログインなら例外。 */
export async function requireAdmin() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  return supabase;
}
