// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareSupabase } from "./lib/supabase/middleware-client";

export async function middleware(request: NextRequest) {
  // Supabase가 갱신한 쿠키를 되돌려 줄 수 있도록 기본 응답을 먼저 준비합니다.
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  const supabase = createMiddlewareSupabase(request, response);

  // access token이 만료돼도 refresh token이 살아 있다면
  // createMiddlewareSupabase 내부의 setAll이 자동으로 새 쿠키를 심어 줍니다.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 보호 라우트: 세션이 없으면 로그인 화면으로 되돌립니다.
  if (!session) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 세션이 유효하므로 갱신된 쿠키가 포함된 응답을 그대로 반환합니다.
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
