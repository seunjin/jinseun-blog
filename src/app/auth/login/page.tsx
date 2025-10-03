"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser-client";

const supabase = createBrowserSupabase();

export default function LoginPage() {
  const searchParams = useSearchParams();

  const redirectPath = useMemo(() => {
    const target = searchParams.get("redirectTo") ?? "/admin";
    return target.startsWith("/admin") ? target : "/admin";
  }, [searchParams]);

  const errorMessage = useMemo(() => {
    const errorCode = searchParams.get("error");
    if (errorCode === "unauthorized") {
      return "등록된 관리자 이메일로만 로그인할 수 있습니다.";
    }
    return null;
  }, [searchParams]);

  const handleLogin = useCallback(async () => {
    const callbackUrl = new URL("/api/auth/callback", location.origin);
    callbackUrl.searchParams.set("redirectTo", redirectPath);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
  }, [redirectPath]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <button
        type="button"
        onClick={handleLogin}
        className="rounded bg-black px-4 py-2 font-medium text-white"
      >
        Google로 로그인
      </button>
      {errorMessage && (
        <div className="flex flex-col items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{errorMessage}</span>
          <div>
            <a
              href="/"
              className="inline-flex items-center gap-1 rounded bg-white px-3 py-1 text-xs font-medium text-red-600 shadow-sm"
            >
              <button>홈으로 가기</button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
