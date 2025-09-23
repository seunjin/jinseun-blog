import { createClient } from "@supabase/supabase-js";
import { getEnvVar } from "@/lib/env";

// 서버 전용 클라이언트입니다(서비스 롤 키 사용).
// 백그라운드 작업이나 관리자용 작업에서만 사용하고, 브라우저에 노출하지 마세요.
export function createSupabaseAdminClient() {
  return createClient(
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
      },
    },
  );
}
