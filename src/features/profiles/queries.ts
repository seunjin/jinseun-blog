import { queryOptions } from "@tanstack/react-query";
import { http } from "@/lib/ky-client";
import type { Profile } from "./types";

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await http.get<Profile[]>("api/profiles");
  return res.data; // res는 이미 ApiSuccess<Profile[]> 타입
}

export const profilesQueryOptions = queryOptions({
  queryKey: ["profiles"] as const,
  queryFn: fetchProfiles,
});
