/**
 * @module ky-client
 * @description 공통 API 클라이언트(균형형, Balanced)와 헬퍼를 제공합니다.
 *
 * # 설계 방향
 * - ky의 기본 동작(throwHttpErrors: true)을 신뢰합니다.
 * - http 계층은 ApiSuccess<Data, Meta> 전체를 반환(확장성 유지).
 * - 데이터만 필요할 때는 httpData.* 또는 React Query select 사용.
 * - 에러는 상위에서 catch하면 항상 ApiError로 표준화됩니다.
 */

import ky from "@toss/ky";
import type { KyInstance, Options } from "ky";
import {
  parseApiResponse,
  ensureOk,
  toApiErrorAsync,
  type ApiSuccess,
} from "./api-response";

/**
 * 서버(Node)에서는 절대 URL이 필요하고, 브라우저에서는 상대 경로 허용
 */
const isServer = typeof window === "undefined";

/**
 * API Origin 우선순위
 */
const envBase =
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

// 서버: 절대 URL 보장 / 브라우저: 없으면 빈 문자열(상대 경로)
const resolvedPrefixUrl = isServer
  ? envBase ?? "http://localhost:3000"
  : envBase ?? "";

/**
 * @description ky의 전역 기본 옵션
 */
const 기본옵션: Options = {
  prefixUrl: resolvedPrefixUrl,
  timeout: 10_000,
  throwHttpErrors: true,
  headers: {},
};

/**
 * @description 공통 API 호출을 위한 ky 인스턴스(전역)입니다.
 */
export const ky클라이언트: KyInstance = ky.create(기본옵션);

/**
 * @description 필요 시 전역 옵션을 덮어쓰는 개별 ky 인스턴스를 생성합니다.
 */
export const ky인스턴스생성 = (옵션?: Options): KyInstance =>
  ky.create({
    ...기본옵션,
    ...옵션,
    headers: {
      ...기본옵션.headers,
      ...옵션?.headers,
    },
  });

/* ──────────────────────────────────────────────────────────
 *  객체형 제네릭 슬롯
 *  - 읽기 요청(GET/DELETE): { data: T; meta?: M }
 *  - 쓰기 요청(POST/PUT/PATCH): { body?: B; data: T; meta?: M }
 * ────────────────────────────────────────────────────────── */
type ReadTypes = { data: unknown; meta?: unknown };
type WriteTypes = { data: unknown; body?: unknown; meta?: unknown };
type DataOf<T extends { data: any }> = T["data"];
type MetaOf<T extends { meta?: any }> = T["meta"];
type BodyOf<T extends { body?: any }> = T["body"];

/**
 * @description 바디 타입에 따라 자동으로 json/body를 선택합니다.
 * - FormData/Blob/ArrayBuffer/URLSearchParams/string → body로 전달 (헤더 자동)
 * - 그 외 객체 → json으로 전달 (application/json 자동)
 */
function withBody(
  options: Options | undefined,
  body: unknown
): Options | undefined {
  if (body === undefined) return options;

  // FormData
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return { ...options, body };
  }
  // Blob (파일/JSON Blob 등)
  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return { ...options, body };
  }
  // ArrayBuffer / Uint8Array 등 바이너리
  if (
    typeof ArrayBuffer !== "undefined" &&
    (body instanceof ArrayBuffer || ArrayBuffer.isView(body))
  ) {
    return { ...options, body: body as any };
  }
  // URLSearchParams
  if (
    typeof URLSearchParams !== "undefined" &&
    body instanceof URLSearchParams
  ) {
    return { ...options, body };
  }
  // 문자열 (text/plain 등)
  if (typeof body === "string") {
    return { ...options, body };
  }

  // 그 외 일반 객체 → JSON
  return { ...options, json: body as any };
}

/**
 * @description HTTP 메소드별 최소 헬퍼 — 항상 ApiSuccess<T, M> 전체 반환
 */
export const http = {
  get: async <T extends ReadTypes>(
    url: string,
    options?: Options
  ): Promise<ApiSuccess<DataOf<T>, MetaOf<T>>> => {
    try {
      const res = await ky클라이언트.get(url, options);
      const parsed = await parseApiResponse<DataOf<T>, MetaOf<T>>(res);
      return ensureOk(parsed);
    } catch (e) {
      throw await toApiErrorAsync(e);
    }
  },

  delete: async <T extends ReadTypes>(
    url: string,
    options?: Options
  ): Promise<ApiSuccess<DataOf<T>, MetaOf<T>>> => {
    try {
      const res = await ky클라이언트.delete(url, options);
      const parsed = await parseApiResponse<DataOf<T>, MetaOf<T>>(res);
      return ensureOk(parsed);
    } catch (e) {
      throw await toApiErrorAsync(e);
    }
  },

  post: async <T extends WriteTypes>(
    url: string,
    body?: BodyOf<T>,
    options?: Options
  ): Promise<ApiSuccess<DataOf<T>, MetaOf<T>>> => {
    try {
      const res = await ky클라이언트.post(url, withBody(options, body));
      const parsed = await parseApiResponse<DataOf<T>, MetaOf<T>>(res);
      return ensureOk(parsed);
    } catch (e) {
      throw await toApiErrorAsync(e);
    }
  },

  put: async <T extends WriteTypes>(
    url: string,
    body?: BodyOf<T>,
    options?: Options
  ): Promise<ApiSuccess<DataOf<T>, MetaOf<T>>> => {
    try {
      const res = await ky클라이언트.put(url, withBody(options, body));
      const parsed = await parseApiResponse<DataOf<T>, MetaOf<T>>(res);
      return ensureOk(parsed);
    } catch (e) {
      throw await toApiErrorAsync(e);
    }
  },

  patch: async <T extends WriteTypes>(
    url: string,
    body?: BodyOf<T>,
    options?: Options
  ): Promise<ApiSuccess<DataOf<T>, MetaOf<T>>> => {
    try {
      const res = await ky클라이언트.patch(url, withBody(options, body));
      const parsed = await parseApiResponse<DataOf<T>, MetaOf<T>>(res);
      return ensureOk(parsed);
    } catch (e) {
      throw await toApiErrorAsync(e);
    }
  },
};

/**
 * @description 데이터만 필요한 경우를 위한 편의 래퍼
 */
export const httpData = {
  get: async <T extends ReadTypes>(url: string, options?: Options) =>
    (await http.get<T>(url, options)).data,
  delete: async <T extends ReadTypes>(url: string, options?: Options) =>
    (await http.delete<T>(url, options)).data,
  post: async <T extends WriteTypes>(
    url: string,
    body?: BodyOf<T>,
    options?: Options
  ) => (await http.post<T>(url, body, options)).data,
  put: async <T extends WriteTypes>(
    url: string,
    body?: BodyOf<T>,
    options?: Options
  ) => (await http.put<T>(url, body, options)).data,
  patch: async <T extends WriteTypes>(
    url: string,
    body?: BodyOf<T>,
    options?: Options
  ) => (await http.patch<T>(url, body, options)).data,
};
