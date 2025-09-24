import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/guard";

// 관리자 전용 API의 예시입니다. 보호된 엔드포인트 패턴 참고용입니다.
export async function GET() {
  try {
    const { session } = await assertAdmin();
    return NextResponse.json({ ok: true, email: session.user.email });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
