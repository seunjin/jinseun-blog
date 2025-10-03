import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabase } from "./lib/supabase/server-client";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = await createServerSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
