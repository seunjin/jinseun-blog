import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
// 이 라우트는 Node 런타임에서 실행되어야 합니다(서비스 롤 키 사용).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OAuth 리디렉션을 처리해 세션을 교환하고, 원래 위치로 이동시킵니다.
export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.redirect(new URL("/signin?reason=env", req.url));
  }

  const res = NextResponse.redirect(new URL("/admin", req.url));
  const supabase = createServerClient(url, anon, {
    cookies: {
      async getAll() {
        return req.cookies
          .getAll()
          .map((c) => ({ name: c.name, value: c.value }));
      },
      async setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  // 쿼리스트링(code, state)을 세션으로 교환
  await supabase.auth.exchangeCodeForSession(req.url);

  // 허용 이메일이 설정된 경우 체크 후 미허용이면 로그인 페이지로 보내기
  const allowList = (process.env.ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowList.length > 0) {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email?.toLowerCase();
    // 임시 디버그: 현재 세션 이메일과 허용 목록 출력
    console.log("[auth/callback] debug", { email, allowList });
    if (!email || !allowList.includes(email)) {
      // 차단 대상 계정은 즉시 정리(관리자 권한으로 삭제)
      try {
        if (data.user?.id) {
          const admin = createSupabaseAdminClient();
          await admin.auth.admin.deleteUser(data.user.id);
        }
      } catch {
        // 삭제 실패는 무시
      }
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL("/signin?reason=forbidden", req.url),
      );
    }
  }

  // redirect 파라미터가 있다면 우선 사용
  const redirect = new URL(req.url).searchParams.get("redirect");
  if (redirect) {
    return NextResponse.redirect(new URL(redirect, req.url));
  }

  return res;
}
