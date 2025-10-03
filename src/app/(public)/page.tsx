import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { Suspense } from "react";
import { profilesQueryOptions } from "@/features/profiles/queries";
import { fetchProfilesServer } from "@/features/profiles/server";
import Profiles from "../_components/Profiles";

export default async function PublicPage() {
  const qc = new QueryClient();
  try {
    const initialProfiles = await fetchProfilesServer();
    qc.setQueryData(profilesQueryOptions.queryKey, initialProfiles);
  } catch (error) {
    console.error("profiles server fetch 실패", error);
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<>불러오는중…</>}>
        <Profiles />
      </Suspense>
    </HydrationBoundary>
  );
}
