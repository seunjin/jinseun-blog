import { createBrowserClient } from "@supabase/ssr";

let browserClient:
  | ReturnType<typeof createBrowserClient>
  | undefined;

/** 브라우저에서 Supabase 클라이언트를 싱글톤으로 생성합니다. */
export function createBrowserSupabase() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return browserClient;
}
