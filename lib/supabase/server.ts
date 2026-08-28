// 管理画面（RSC・Server Actions）用の cookie ベースクライアント。
// 公開ページのデータ取得では使わないこと（動的レンダリング化するため）。
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // RSC からの呼び出しでは set できない（middleware がセッションを更新する）
          }
        },
      },
    },
  );
}
