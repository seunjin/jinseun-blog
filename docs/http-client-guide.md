# HTTP Client & API Response 가이드

이 문서는 Next.js + Supabase 프로젝트에서 공통 HTTP 클라이언트(`src/lib/ky-client.ts`), 응답 규약(`src/lib/api-response.ts`), React Query 연동(`src/lib/hooks/…`)을 사용하는 방법을 정리합니다.

## 환경 변수와 prefixUrl
`ky` 인스턴스는 아래 우선순위로 API Origin을 결정합니다.

1. `NEXT_PUBLIC_API_ORIGIN`
2. `NEXT_PUBLIC_API_BASE_URL`
3. `NEXT_PUBLIC_SITE_URL`
4. `NEXT_PUBLIC_SUPABASE_URL`
5. `VERCEL_URL`

서버(Node)에서는 반드시 절대 URL을 사용해야 하므로, 상기 변수 중 하나를 설정하세요. 로컬 개발은 `.env.local`의 `NEXT_PUBLIC_API_ORIGIN=http://localhost:3000` 기본값으로 충분합니다. 브라우저에서는 값이 없으면 상대 경로(현재 오리진)를 사용합니다.

## ky 헬퍼(`http`) 사용법
`src/lib/ky-client.ts`는 `ky.create`로 전역 인스턴스를 만들고, 얇은 래퍼 `http` 객체를 제공합니다.

```ts
const response = await http.get<ApiResponse<User>>("/api/users", {
  searchParams: { page: 1 },
});
```

- `http.get/delete`에 `searchParams`를 그대로 넘기면 ky가 처리합니다.
- `http.post/put/patch`는 `body`가 `undefined`일 때 `json` 옵션을 보내지 않으므로, 빈 바디 + JSON 헤더 이슈가 없습니다.
- multipart/FormData는 `ky클라이언트.post(url, { body: formData })`처럼 직접 호출하세요.

## ApiResponse 규약
`src/lib/api-response.ts`는 성공/실패 응답을 공통 구조로 정의합니다.

```ts
export type ApiResponse<Data = unknown, Meta = undefined> =
  | ApiSuccess<Data, Meta>
  | ApiFailure;
```

주요 헬퍼:

- `ensureOk(response)` → 성공 응답(`ApiSuccess`)만 반환, 실패면 `ApiError` 던짐.
- `unwrap(response)` → 성공 시 `data`만 반환, 실패 시 `ApiError`.
- `isOk(response)` → 성공/실패 분기.
- `toApiError(error)` / `mapHttpErrorToApiError(error)` → ky가 던지는 `HTTPError`를 규약에 맞춘 `ApiError`로 변환.

실패 응답을 내려줄 때는 `ApiFailure` 형태를 지켜 주세요. 예: `success: false`, `error.code`, `error.message`, `statusCode` 등.

### `throwHttpErrors: false`를 사용할 때 주의

기본값은 `true`이며, 실패 응답을 자동으로 예외로 처리합니다. 아래 상황에 한해 `false`로 설정하는 것을 권장합니다.

1. **응답 본문으로 직접 분기해야 할 때**: 예) React Query 훅에서 `isOk(response)`로 실패 응답을 그대로 UI에 노출해야 하는 경우.
2. **중간 어댑터에서 공통 후처리가 필요한 경우**: 서버에서 항상 `success`/`error` 구조를 제공하고, 예외 대신 응답 값을 가공해야 할 때.

그 외 케이스에서는 기본 설정을 유지해 실패를 명확히 감지하고, `try/catch`에서 `toApiError`로 변환하세요.

## React Query 연동
`src/app/providers/query-client-provider.tsx`에서 `QueryClientProvider`를 최상위 레이아웃에 추가했습니다. 클라이언트 컴포넌트에서 React Query를 사용할 수 있습니다.

예시 훅: `src/lib/hooks/use-test-greeting.ts`

```ts
export function useTestGreeting(name: string) {
  return useQuery<ApiSuccess<GreetingData>>({
    queryKey: ["test-greeting", name],
    queryFn: async () => {
      const response = await http.get<ApiResponse<GreetingData>>("/api/test", {
        searchParams: { name },
        throwHttpErrors: false,
      });
      return ensureOk(response);
    },
  });
}
```

- `queryKey`는 `as const` 튜플로 만들면 캐시 키가 안정적으로 추적됩니다.
- `throwHttpErrors: false` 옵션은 반드시 `isOk`/`ensureOk`와 함께 사용해 실패를 놓치지 않도록 하세요.
- 컴포넌트에서는 `isError`, `data`, `error` 등을 활용해 UI를 구성합니다.

## 서버 컴포넌트 / API 라우트 주의 사항
- 서버 컴포넌트에서 `http.get("/api/..." )`을 쓸 때는 절대 URL이 필요합니다. `http` 래퍼는 `prefixUrl`로 이를 해결하지만, 추가적으로 `new URL(path, base)`를 사용하는 유틸을 만들어도 좋습니다.
- Next.js API 라우트는 응답을 항상 `ApiResponse` 포맷으로 내려주어 프런트와 규약을 맞추세요. 빈 본문이나 JSON 파싱 오류는 `request.text()`로 먼저 처리한 뒤 명시적 실패 응답을 보내는 방식이 안전합니다.

## 추가 가이드
- Ky 인스턴스에서 `throwHttpErrors` 기본값은 `true`입니다. `false`로 설정할 경우, 실패 응답을 반드시 `isOk`/`ensureOk`와 같은 헬퍼로 확인하세요.
- `ensureOk`를 사용하면 `ApiSuccess` 구조 전체를 유지하여 `meta`, `statusCode` 등 부가값을 활용할 수 있습니다.
- React Query로 Supabase API를 감쌀 때도 동일 패턴을 적용하면 캐싱/에러 처리 로직을 반복 없이 재사용할 수 있습니다.
