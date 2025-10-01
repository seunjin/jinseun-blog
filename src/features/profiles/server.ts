import { createServerSupabase } from "@/lib/supabase/server-client";
import { Profile } from "./types";

export async function fetchProfilesServer(): Promise<Profile[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
