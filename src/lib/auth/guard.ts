import { createSupabaseServerClient } from "@/lib/supabase/server";

// 서버 액션/Route Handler에서 재사용할 관리자 권한 가드입니다.
// - 세션이 없으면 UNAUTHORIZED(401)
// - 허용 이메일 목록(ADMIN_ALLOWED_EMAILS)에 없으면 FORBIDDEN(403)
// - 통과 시 Supabase 클라이언트와 세션을 반환합니다.
export async function assertAdmin() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  const allowList = (process.env.ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allowList.length > 0) {
    const email = session.user.email?.toLowerCase();
    if (!email || !allowList.includes(email)) {
      throw new Error("FORBIDDEN");
    }
  }

  return { supabase, session };
}
