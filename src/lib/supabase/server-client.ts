import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Component·Route Handler에서 사용할 Supabase 클라이언트를 생성합니다.
 * middleware가 세션 쿠키를 갱신하고 있으므로 여기서는 갱신 실패를 무시해도 안전합니다.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component에서는 쿠키 쓰기가 금지되어 있으므로 무시합니다.
            // middleware에서 쿠키를 갱신해 주므로 세션이 유지됩니다.
          }
        },
      },
    }
  );
}
