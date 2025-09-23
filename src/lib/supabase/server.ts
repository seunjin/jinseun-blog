import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnvVar } from "@/lib/env";

// 서버 컴포넌트/서버 액션/Route Handler에서 사용할 Supabase 클라이언트를 생성합니다.
// Next의 cookies API를 통해 인증 세션(sb 쿠키)을 읽고/쓰기 합니다.
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        // @supabase/ssr가 기대하는 새로운 쿠키 인터페이스(getAll/setAll)
        async getAll() {
          return (await cookieStore)
            .getAll()
            .map((c) => ({ name: c.name, value: c.value }));
        },
        // 여러 쿠키를 한 번에 기록합니다. 정적 생성 등 일부 컨텍스트에서는
        // 쿠키 API가 읽기 전용일 수 있어 try/catch로 감쌉니다.
        async setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              (await cookieStore).set({ name, value, ...options });
            }
          } catch (_error) {
            // 읽기 전용 컨텍스트에서는 무시합니다.
          }
        },
      },
    },
  );
}

// (getAll/setAll API를 사용하므로 별도의 쿠키 타입 헬퍼는 필요하지 않습니다)
