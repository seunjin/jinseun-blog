import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware에서 사용할 Supabase 클라이언트를 생성합니다.
 * - 요청 쿠키를 Supabase에 넘겨 세션 정보를 확인하고
 * - Supabase가 내려주는 갱신된 쿠키를 응답에 그대로 복사합니다.
 */
export function createMiddlewareSupabase(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        /** 들어온 요청의 모든 쿠키를 Supabase에 제공 */
        getAll() {
          return request.cookies.getAll();
        },
        /** Supabase가 쿠키 갱신을 요구하면 응답 쿠키에 그대로 반영 */
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
