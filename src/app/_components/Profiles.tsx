// src/app/_components/Profiles.tsx (Client Component)
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { profilesQueryOptions } from "@/features/profiles/queries";

export default function Profiles() {
  const { data: profiles } = useSuspenseQuery(profilesQueryOptions);
  return (
    <ul className="space-y-2 text-sm">
      {profiles.map((profile) => (
        <li key={profile.id} className="rounded border p-3">
          <div className="font-medium">{profile.name ?? "이름 미정"}</div>
          <div className="text-gray-500">{profile.email ?? "이메일 없음"}</div>
          <div className="text-xs text-gray-400">
            권한: {profile.role ?? "user"} · 생성일: {profile.created_at ?? "–"}
          </div>
        </li>
      ))}
    </ul>
  );
}
