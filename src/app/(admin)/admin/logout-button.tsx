"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser-client";

const supabase = createBrowserSupabase();

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <button type="button" onClick={handleLogout} className="text-sm font-medium">
      로그아웃
    </button>
  );
}
