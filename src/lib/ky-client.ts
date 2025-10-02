/**
 * Ky 기반 공통 HTTP 클라이언트.
 *
 * ## Quick Start
 * ```ts
 * const response = await http.get<{ responseData: Profile[] }>("api/profiles");
 * console.log(response.data.length);
 *
 * // 데이터만 필요한 경우
 * const profiles = await httpData.get<{ responseData: Profile[] }>("api/profiles");
 * ```
 *
 * ## 왜 이 유틸을 쓰나요?
 * - ky 기본 동작(`throwHttpErrors: true`)을 신뢰하면서도, 모든 호출이 `ApiSuccess`/`ApiError` 규약을 따르도록 강제합니다.
 * - 성공 응답은 메타 정보까지 포함한 전체 객체를 반환하고, 데이터만 필요하면 `httpData.*`로 축약할 수 있습니다.
 * - 에러는 항상 `ApiError`로 변환되므로 UI·로깅 레이어에서 일관되게 처리할 수 있습니다.
 *
 * ## Body 전달 요약(withBody)
 * - JSON 전송: `http.post<{ requestData: SomeDto; responseData: R }>(url, dto);`
 * - 멀티파트/파일: `const form = new FormData(); form.append("file", file); await http.post<{ requestData: FormData; responseData: R }>(url, form);`
 * - 문자열/URLSearchParams/Blob 등은 그대로 body로 전달되며, ky가 적절한 헤더를 설정합니다.
 */

import ky from "@toss/ky";
import type { KyInstance, Options } from "ky";
import {
  type ApiSuccess,
  ensureOk,
  parseApiResponse,
  toApiError,
} from "./api-response";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** 서버(Node)에서는 절대 URL이 필요하고, 브라우저에서는 상대 경로 허용 */
const isServer = typeof window === "undefined";

/** API Origin 우선순위 */
const envBase =
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

// 서버: 절대 URL 보장 / 브라우저: 없으면 상대 경로 사용
const resolvedPrefixUrl = isServer
  ? envBase ?? "http://localhost:3000"
  : envBase ?? "";

/** ky 전역 기본 옵션 */
const 기본옵션: Options = {
  prefixUrl: resolvedPrefixUrl,
  timeout: 10_000,
  throwHttpErrors: true,
  headers: {},
};

/** 전역 ky 인스턴스 */
export const ky클라이언트: KyInstance = ky.create(기본옵션);

/** 필요 시 전역 옵션을 덮어쓰는 개별 ky 인스턴스 생성기 */
export const ky인스턴스생성 = (옵션?: Options): KyInstance =>
  ky.create({
    ...기본옵션,
    ...옵션,
    headers: {
      ...기본옵션.headers,
      ...옵션?.headers,
    },
  });

// ---------------------------------------------------------------------------
// Generic schemas
// ---------------------------------------------------------------------------

export type HttpReadSchema<Data, Meta = undefined> = {
  responseData: Data;
  responseMeta?: Meta;
};

export type HttpWriteSchema<Body, Data, Meta = undefined> = {
  requestData?: Body;
  responseData: Data;
  responseMeta?: Meta;
};

type ResponseDataOf<T extends { responseData: unknown }> = T["responseData"];
type ResponseMetaOf<T extends { responseMeta?: unknown }> = T["responseMeta"];
type RequestDataOf<T extends { requestData?: unknown }> = T["requestData"];

// ---------------------------------------------------------------------------
// Body helper
// ---------------------------------------------------------------------------

/**
 * ky 옵션과 body 인자를 조합해 적절한 전송 방식을 결정합니다.
 * - 함수 인자 `body`가 있다면 이것을 우선 적용하고, 기존 `options.json/body`는 제거합니다.
 * - `body`가 없으면 전달된 옵션을 그대로 사용합니다.
 */
function withBody(
  options: Options | undefined,
  body: unknown
): Options | undefined {
  const next: Options | undefined = options ? { ...options } : undefined;

  if (body !== undefined) {
    if (next) {
      if ("json" in next) delete (next as Record<string, unknown>).json;
      if ("body" in next) delete (next as Record<string, unknown>).body;
    }

    if (typeof FormData !== "undefined" && body instanceof FormData) {
      return { ...next, body };
    }
    if (typeof Blob !== "undefined" && body instanceof Blob) {
      return { ...next, body };
    }
    if (
      typeof ArrayBuffer !== "undefined" &&
      (body instanceof ArrayBuffer || ArrayBuffer.isView(body))
    ) {
      return { ...next, body: body as BodyInit };
    }
    if (
      typeof URLSearchParams !== "undefined" &&
      body instanceof URLSearchParams
    ) {
      return { ...next, body };
    }
    if (typeof body === "string") {
      return { ...next, body };
    }

    return { ...next, json: body };
  }

  return next;
}

// ---------------------------------------------------------------------------
// High-level helpers
// ---------------------------------------------------------------------------

type ReadSchema = HttpReadSchema<unknown, unknown>;
type WriteSchema = HttpWriteSchema<unknown, unknown, unknown>;

/**
 * HTTP 메소드 래퍼. 항상 `ApiSuccess` 전체 객체를 반환합니다.
 * 데이터만 필요할 때는 아래 `httpData`를 사용하세요.
 */
export const http = {
  get: async <Schema extends ReadSchema>(
    url: string,
    options?: Options
  ): Promise<ApiSuccess<ResponseDataOf<Schema>, ResponseMetaOf<Schema>>> => {
    try {
      const res = await ky클라이언트.get(url, options);
      const parsed = await parseApiResponse<
        ResponseDataOf<Schema>,
        ResponseMetaOf<Schema>
      >(res);
      return ensureOk(parsed);
    } catch (error) {
      throw await toApiError(error);
    }
  },

  delete: async <Schema extends ReadSchema>(
    url: string,
    options?: Options
  ): Promise<ApiSuccess<ResponseDataOf<Schema>, ResponseMetaOf<Schema>>> => {
    try {
      const res = await ky클라이언트.delete(url, options);
      const parsed = await parseApiResponse<
        ResponseDataOf<Schema>,
        ResponseMetaOf<Schema>
      >(res);
      return ensureOk(parsed);
    } catch (error) {
      throw await toApiError(error);
    }
  },

  post: async <Schema extends WriteSchema>(
    url: string,
    requestData?: RequestDataOf<Schema>,
    options?: Options
  ): Promise<ApiSuccess<ResponseDataOf<Schema>, ResponseMetaOf<Schema>>> => {
    try {
      const res = await ky클라이언트.post(url, withBody(options, requestData));
      const parsed = await parseApiResponse<
        ResponseDataOf<Schema>,
        ResponseMetaOf<Schema>
      >(res);
      return ensureOk(parsed);
    } catch (error) {
      throw await toApiError(error);
    }
  },

  put: async <Schema extends WriteSchema>(
    url: string,
    requestData?: RequestDataOf<Schema>,
    options?: Options
  ): Promise<ApiSuccess<ResponseDataOf<Schema>, ResponseMetaOf<Schema>>> => {
    try {
      const res = await ky클라이언트.put(url, withBody(options, requestData));
      const parsed = await parseApiResponse<
        ResponseDataOf<Schema>,
        ResponseMetaOf<Schema>
      >(res);
      return ensureOk(parsed);
    } catch (error) {
      throw await toApiError(error);
    }
  },

  patch: async <Schema extends WriteSchema>(
    url: string,
    requestData?: RequestDataOf<Schema>,
    options?: Options
  ): Promise<ApiSuccess<ResponseDataOf<Schema>, ResponseMetaOf<Schema>>> => {
    try {
      const res = await ky클라이언트.patch(url, withBody(options, requestData));
      const parsed = await parseApiResponse<
        ResponseDataOf<Schema>,
        ResponseMetaOf<Schema>
      >(res);
      return ensureOk(parsed);
    } catch (error) {
      throw await toApiError(error);
    }
  },
};

/** 데이터만 필요할 때 사용하는 축약 래퍼 */
export const httpData = {
  get: async <Schema extends ReadSchema>(url: string, options?: Options) =>
    (await http.get<Schema>(url, options)).data,
  delete: async <Schema extends ReadSchema>(url: string, options?: Options) =>
    (await http.delete<Schema>(url, options)).data,
  post: async <Schema extends WriteSchema>(
    url: string,
    requestData?: RequestDataOf<Schema>,
    options?: Options
  ) => (await http.post<Schema>(url, requestData, options)).data,
  put: async <Schema extends WriteSchema>(
    url: string,
    requestData?: RequestDataOf<Schema>,
    options?: Options
  ) => (await http.put<Schema>(url, requestData, options)).data,
  patch: async <Schema extends WriteSchema>(
    url: string,
    requestData?: RequestDataOf<Schema>,
    options?: Options
  ) => (await http.patch<Schema>(url, requestData, options)).data,
};

// ---------------------------------------------------------------------------
// 참고: 직접 ky를 써야 할 때
// ---------------------------------------------------------------------------

/**
 * - 특수 헤더나 ky의 고급 옵션을 써야 한다면 `ky인스턴스생성`으로 별도 인스턴스를 만들고
 *   `parseApiResponse` → `ensureOk` 조합을 직접 호출하세요.
 * - multipart + JSON 혼합이 필요한 경우에는 FormData를 활용해 `http.post`에 그대로 넘기는 것이 안전합니다.
 */
