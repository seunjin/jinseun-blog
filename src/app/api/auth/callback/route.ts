// route.ts (edge 가능)
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server-client";
import { fetchProfileByEmailServer } from "@/features/profiles/server";

export async function GET(req: Request) {
  const supabase = await createServerSupabase();
  const { searchParams } = new URL(req.url);
  // OAuth 인증 후 리다이렉트된 URL에서 code 파라미터 추출
  // 예: /api/auth/callback?code=xxxxxx&state=yyyyyy
  // state 파라미터 검증 로직도 필요할 수 있음 (CSRF 방지)
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-the-auth-state-within-middleware
  // https://supabase.com/docs/reference/javascript/auth-signinwithoauth
  // https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession
  const code = searchParams.get("code");
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user.email;
  const redirectTo = searchParams.get("redirectTo") ?? "/admin";
  const safeRedirect = redirectTo.startsWith("/admin") ? redirectTo : "/admin";

  if (!email) {
    await supabase.auth.signOut();
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("error", "unauthorized");
    loginUrl.searchParams.set("redirectTo", safeRedirect);
    return NextResponse.redirect(loginUrl);
  }
  /**이메일로 단일 프로필을 조회합니다. */
  const checkProfileByEmail = await fetchProfileByEmailServer(email);
  if (!checkProfileByEmail) {
    await supabase.auth.signOut();
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("error", "unauthorized");
    loginUrl.searchParams.set("redirectTo", safeRedirect);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(safeRedirect, req.url));
}
