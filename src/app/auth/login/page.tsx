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
    <div className="flex min-h-screen items-center justify-center">
      <button
        type="button"
        onClick={handleLogin}
        className="rounded bg-black px-4 py-2 font-medium text-white"
      >
        Google로 로그인
      </button>
    </div>
  );
}
