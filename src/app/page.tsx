import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { Suspense } from "react";
import Profiles from "./_components/Profiles";
import { profilesQueryOptions } from "@/features/profiles/queries";
import { fetchProfilesServer } from "@/features/profiles/server";

export default async function HomePage() {
  const qc = new QueryClient();
  try {
    const initialProfiles = await fetchProfilesServer();
    qc.setQueryData(profilesQueryOptions.queryKey, initialProfiles);
  } catch (error) {
    console.error("profiles server fetch 실패", error);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">API 테스트</h1>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<>불러오는중…</>}>
          <Profiles />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
