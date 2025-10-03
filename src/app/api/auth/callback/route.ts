// route.ts (edge 가능)
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server-client";

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

  const redirectTo = searchParams.get("redirectTo") ?? "/admin";
  const safeRedirect = redirectTo.startsWith("/admin") ? redirectTo : "/admin";

  return NextResponse.redirect(new URL(safeRedirect, req.url));
}
