# React Query Prefetch 패턴 가이드

Next.js(App Router) + Supabase + React Query 조합에서 서버/클라이언트 양쪽을 깔끔하게 다루기 위한 권장 패턴을 정리했습니다.

## 목표

- **서버에서 Supabase RLS 정책을 통과해 안전하게 초기 데이터를 확보**
- 확보한 데이터를 **React Query 캐시에 채워 하이드레이션**
- 클라이언트에서는 `useSuspenseQuery` 등 기존 훅을 그대로 사용
- 여러 API를 동시에 프리패치할 때도 반복 코드를 최소화

---

## 1. Supabase 클라이언트 구성

```ts
// src/lib/supabase/server-client.ts
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* Server Component에서 setAll이 호출된 경우는 무시 */
          }
        },
      },
    }
  );
}
```

브라우저에서 Supabase를 직접 호출할 계획이 없다면 서버 전용 클라이언트 하나만 유지해도 충분합니다.

---

## 2. 서버 전용 fetch 함수

```ts
// src/features/profiles/server.ts
import { createServerSupabase } from "@/lib/supabase/server-client";
import type { Profile } from "./types";

export async function fetchProfilesServer(): Promise<Profile[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
```

Supabase SDK를 직접 호출하면 RLS 정책을 준수한 상태에서 데이터를 가져올 수 있습니다.

---

## 3. 클라이언트용 fetch + React Query 옵션

```ts
// src/features/profiles/queries.ts
import { queryOptions } from "@tanstack/react-query";
import { http } from "@/lib/ky-client";
import { ensureOk, toApiError, type ApiResponse } from "@/lib/api-response";
import type { Profile } from "./types";

export async function fetchProfiles(): Promise<Profile[]> {
  try {
    const res = await http.get<ApiResponse<Profile[]>>("api/profiles");
    return ensureOk(res).data;
  } catch (error) {
    throw toApiError(error);
  }
}

export const profilesQueryOptions = queryOptions({
  queryKey: ["profiles"] as const,
  queryFn: fetchProfiles,
});
```

`http.get` 내부에서 `ensureOk`/`toApiError`를 처리하기 때문에 호출부는 성공 데이터만 신경 쓰면 됩니다.

---

## 4. 서버에서 초기 데이터 주입 + Hydration

```tsx
// src/app/page.tsx
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
  const queryClient = new QueryClient();

  try {
    const initialProfiles = await fetchProfilesServer();
    queryClient.setQueryData(profilesQueryOptions.queryKey, initialProfiles);
  } catch (error) {
    console.error("profiles prefetch 실패", error);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<>불러오는중…</>}>
          <Profiles />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
```

- 서버에서 Supabase로 직접 데이터를 가져와 QueryClient 캐시에 넣습니다.
- 하이드레이션 이후 클라이언트에서 React Query가 동일한 캐시를 이어받습니다.
- 이후 refetch, 폴링 등은 React Query가 처리합니다.

---

## 5. 여러 API를 동시에 프리패치할 때

```ts
type PrefetchTask<T> = {
  key: QueryKey;
  fetcher: () => Promise<T>;
};

async function prefetchAll(qc: QueryClient, tasks: PrefetchTask<unknown>[]) {
  const results = await Promise.allSettled(tasks.map((task) => task.fetcher()));

  results.forEach((result, index) => {
    const { key } = tasks[index];
    if (result.status === "fulfilled") {
      qc.setQueryData(key, result.value);
    } else {
      console.error(`${key} prefetch 실패`, result.reason);
    }
  });
}
```

```ts
async function prefetchAll(qc: QueryClient) {
  const tasks = [
    { key: profilesQueryOptions.queryKey, fetcher: fetchProfilesServer },
    { key: tagsQueryOptions.queryKey, fetcher: fetchTagsServer },
    // ... 필요한 만큼 추가
  ];

  const results = await Promise.allSettled(tasks.map((task) => task.fetcher()));

  results.forEach((result, index) => {
    const { key } = tasks[index];
    if (result.status === "fulfilled") {
      qc.setQueryData(key, result.value);
    } else {
      console.error(`${key} prefetch 실패`, result.reason);
    }
  });
}
```

`Promise.allSettled`를 사용하면 일부 API가 실패해도 나머지는 정상적으로 캐시에 채울 수 있습니다.

---

## 6. HTTP 헬퍼에서 ApiResponse 처리

```ts
// src/lib/ky-client.ts (발췌)
export const http = {
  get: async <T>(url: string, options?: Options) => {
    try {
      const response = await ky클라이언트
        .get(url, options)
        .json<ApiResponse<T>>();
      return ensureOk(response);
    } catch (error) {
      throw toApiError(error);
    }
  },
  // post/put/patch/delete도 동일 패턴으로 정의 가능
};
```

- 모든 HTTP 요청이 `ApiResponse` 규약에 맞게 처리됩니다.
- 성공 시 `ApiSuccess<T>`가 반환되고, 실패 시 `ApiError`가 던져집니다.

---

## 요약

1. **서버**: Supabase SDK를 직접 사용해 초기 데이터를 가져오고, React Query 캐시에 주입합니다.
2. **클라이언트**: 동일한 queryKey를 사용해 React Query의 Suspense/훅을 그대로 활용합니다.
3. **여러 API**: `Promise.allSettled` 또는 공용 유틸로 초기 데이터 프리패치를 반복 없이 처리합니다.
4. **HTTP 헬퍼**: `ApiResponse`를 내부에서 처리해 호출부가 비즈니스 로직에 집중하도록 합니다.

이 패턴을 기반으로 필요한 기능 추가(필터, 페이징, 실시간 갱신 등)를 계속 확장할 수 있습니다.
