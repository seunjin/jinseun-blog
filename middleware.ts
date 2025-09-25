import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// /admin 경로 보호 미들웨어
// - 인증 세션이 없는 사용자는 /signin 으로 리다이렉트합니다.
// - 쿠키 동기화를 위해 @supabase/ssr 의 getAll/setAll 인터페이스를 사용합니다.
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 보호 경로: /admin 하위
  if (req.nextUrl.pathname.startsWith("/admin")) {
    // 임시 디버그: 세션/이메일/허용 목록 출력
    const email = session?.user.email?.toLowerCase();
    const allowList = (process.env.ADMIN_ALLOWED_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    console.log("[middleware] debug", {
      path: req.nextUrl.pathname,
      hasSession: !!session,
      email,
      allowList,
    });

    // 세션이 없으면 로그인 페이지로 이동
    if (!session) {
      const redirectUrl = new URL("/signin", req.url);
      redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // 허용 이메일 목록(쉼표 구분)이 설정되었다면 검사
    if (allowList.length > 0) {
      if (!email || !allowList.includes(email)) {
        const forbidden = new URL("/signin", req.url);
        forbidden.searchParams.set("reason", "forbidden");
        return NextResponse.redirect(forbidden);
      }
    }
  }

  return res;
}

// 이 미들웨어가 적용될 경로 매칭
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
