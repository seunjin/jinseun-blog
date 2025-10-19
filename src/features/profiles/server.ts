import { createServerSupabase } from "@/lib/supabase/server-client";
import type { Profile } from "./types";

/**
 * 이메일로 단일 프로필을 조회합니다.
 * - Supabase RLS를 통과한 상태에서만 호출되므로 서버 전용으로 사용합니다.
 * - 존재하지 않으면 null을 반환하고, 쿼리 오류는 예외로 전달합니다.
 */
export async function fetchProfileByEmailServer(
  email: string
): Promise<Pick<Profile, "id" | "email"> | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * 최신 생성 순으로 프로필 목록을 조회합니다.
 * - Admin 화면의 목록 프리패치 등 서버 측 데이터 패칭에 사용합니다.
 */
export async function fetchProfilesServer(): Promise<Profile[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, role, createdAt, updatedAt")
    .order("createdAt", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
