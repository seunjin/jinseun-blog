import { createBrowserClient } from "@supabase/ssr";
import { getEnvVar } from "@/lib/env";

// 브라우저(클라이언트 컴포넌트)에서 사용할 Supabase 클라이언트를 반환합니다.
// anon key를 사용하므로 클라이언트에 노출되어도 안전합니다.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
