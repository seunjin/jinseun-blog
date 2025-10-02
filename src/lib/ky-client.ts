/**
 * @module ky-client
 * @description 공통 API 클라이언트(균형형, Balanced)와 헬퍼를 제공합니다.
 *
 * # 설계 방향
 * - ky의 기본 동작(throwHttpErrors: true)을 신뢰합니다.
 * - http 계층은 ApiSuccess<Data, Meta> 전체를 반환(확장성 유지).
 * - 데이터만 필요할 때는 httpData.* 또는 React Query select 사용.
 * - 에러는 상위에서 catch하면 항상 ApiError로 표준화됩니다.
 *
 * # withBody 사용 가이드 (중요)
 * - 함수 인자 `body`를 사용하는 경우, `options.json`/`options.body`를 함께 넘기지 마세요.
 *   (혼선을 막기 위해 withBody가 충돌을 자동으로 정리합니다)
 * - JSON 전송 → `json` 사용 (자동 Content-Type: application/json)
 * - FormData/Blob/바이너리/URLSearchParams/문자열 → `body` 사용
 * - JSON + 파일(멀티파트) → FormData에 JSON 문자열(또는 JSON Blob)과 파일을 함께 담아 `body`로 전송
 *
 * ## 사용 예시
 * ```ts
 * // JSON POST (Meta 포함)
 * await http.post<{
 *   requestData: { name: string };
 *   responseData: Profile;
 *   responseMeta: { correlationId: string };
 * }>("api/profiles", { name: "jin" });
 *
 * // 파일 업로드(FormData)
 * const form = new FormData();
 * form.append("image", file);
 * form.append("payload", JSON.stringify({ title: "hello" }));
 * await http.post<{
 *   requestData: FormData;
 *   responseData: UploadResult;
 * }>("api/uploads", form);
 * ```
 */

import ky from "@toss/ky";
import type { KyInstance, Options } from "ky";
import {
  parseApiResponse,
  ensureOk,
  toApiErrorAsync,
  type ApiSuccess,
} from "./api-response";

/** 서버(Node)에서는 절대 URL이 필요하고, 브라우저에서는 상대 경로 허용 */
const isServer = typeof window === "undefined";

/** API Origin 우선순위 */
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

/** ky 전역 기본 옵션 */
const 기본옵션: Options = {
  prefixUrl: resolvedPrefixUrl,
  timeout: 10_000,
  throwHttpErrors: true,
  headers: {},
};

/** 전역 ky 인스턴스 */
export const ky클라이언트: KyInstance = ky.create(기본옵션);

/** 개별 인스턴스 생성기 */
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
type WriteTypes = {
  requestData?: unknown; // 요청 본문
  responseData: unknown; // 응답 데이터
  responseMeta?: unknown; // 응답 부가 정보
};

type ReadTypes = {
  responseData: unknown; // 응답 데이터
  responseMeta?: unknown; // 응답 부가 정보
};
type ResponseDataOf<T extends { responseData: any }> = T["responseData"];
type ResponseMetaOf<T extends { responseMeta?: any }> = T["responseMeta"];
type RequestDataOf<T extends { requestData?: any }> = T["requestData"];

/**
 * @description 바디 타입에 따라 자동으로 json/body를 선택합니다.
 *
 * ## 충돌 처리 정책 (문서화)
 * - 함수 인자 `body`가 주어지면 이것이 **최우선**입니다.
 *   - 이 경우, `options.json`/`options.body`는 **무시/제거**되어 혼선을 방지합니다.
 * - 함수 인자 `body`가 없고 `options.json`만 있으면 → JSON 전송
 * - 함수 인자 `body`가 없고 `options.body`만 있으면 → body 전송
 *
 * ## 주의
 * - 호출부에서는 “`body`를 쓰면 `options.json`을 넘기지 않는다”는 원칙을 지키세요.
 * - 멀티파트는 반드시 FormData를 사용하세요. (Content-Type 자동 설정)
 */
function withBody(
  options: Options | undefined,
  body: unknown
): Options | undefined {
  // 기반 옵션 얕은 복사: 아래에서 json/body 충돌을 정리
  let next: Options | undefined = options ? { ...options } : undefined;

  // 헬퍼로 body가 들어온 경우 → 최우선
  if (body !== undefined) {
    // 호출부 혼선을 방지하기 위해 기존 options의 json/body 제거
    if (next) {
      if ("json" in next) delete (next as any).json;
      if ("body" in next) delete (next as any).body;
    }

    // FormData
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      return { ...next, body };
    }
    // Blob (파일/JSON Blob 등)
    if (typeof Blob !== "undefined" && body instanceof Blob) {
      return { ...next, body };
    }
    // ArrayBuffer / TypedArray
    if (
      typeof ArrayBuffer !== "undefined" &&
      (body instanceof ArrayBuffer || ArrayBuffer.isView(body))
    ) {
      return { ...next, body: body as any };
    }
    // URLSearchParams
    if (
      typeof URLSearchParams !== "undefined" &&
      body instanceof URLSearchParams
    ) {
      return { ...next, body };
    }
    // 문자열
    if (typeof body === "string") {
      return { ...next, body };
    }
    // 나머지 객체 → JSON
    return { ...next, json: body as any };
  }

  // body 인자가 없을 때: options에 설정된 json/body를 그대로 사용
  return next;
}

/**
 * @description HTTP 메소드별 최소 헬퍼 — 항상 ApiSuccess<T, M> 전체 반환
 */
export const http = {
  // GET / DELETE: ReadTypes 사용
  get: async <T extends ReadTypes>(
    url: string,
    options?: Options
  ): Promise<ApiSuccess<ResponseDataOf<T>, ResponseMetaOf<T>>> => {
    try {
      const res = await ky클라이언트.get(url, options);
      const parsed = await parseApiResponse<
        ResponseDataOf<T>,
        ResponseMetaOf<T>
      >(res);
      return ensureOk(parsed);
    } catch (e) {
      throw await toApiErrorAsync(e);
    }
  },

  delete: async <T extends ReadTypes>(
    url: string,
    options?: Options
  ): Promise<ApiSuccess<ResponseDataOf<T>, ResponseMetaOf<T>>> => {
    try {
      const res = await ky클라이언트.delete(url, options);
      const parsed = await parseApiResponse<
        ResponseDataOf<T>,
        ResponseMetaOf<T>
      >(res);
      return ensureOk(parsed);
    } catch (e) {
      throw await toApiErrorAsync(e);
    }
  },

  // POST / PUT / PATCH: WriteTypes 사용 (requestData 전달)
  post: async <T extends WriteTypes>(
    url: string,
    requestData?: RequestDataOf<T>,
    options?: Options
  ): Promise<ApiSuccess<ResponseDataOf<T>, ResponseMetaOf<T>>> => {
    try {
      const res = await ky클라이언트.post(url, withBody(options, requestData));
      const parsed = await parseApiResponse<
        ResponseDataOf<T>,
        ResponseMetaOf<T>
      >(res);
      return ensureOk(parsed);
    } catch (e) {
      throw await toApiErrorAsync(e);
    }
  },

  put: async <T extends WriteTypes>(
    url: string,
    requestData?: RequestDataOf<T>,
    options?: Options
  ): Promise<ApiSuccess<ResponseDataOf<T>, ResponseMetaOf<T>>> => {
    try {
      const res = await ky클라이언트.put(url, withBody(options, requestData));
      const parsed = await parseApiResponse<
        ResponseDataOf<T>,
        ResponseMetaOf<T>
      >(res);
      return ensureOk(parsed);
    } catch (e) {
      throw await toApiErrorAsync(e);
    }
  },

  patch: async <T extends WriteTypes>(
    url: string,
    requestData?: RequestDataOf<T>,
    options?: Options
  ): Promise<ApiSuccess<ResponseDataOf<T>, ResponseMetaOf<T>>> => {
    try {
      const res = await ky클라이언트.patch(url, withBody(options, requestData));
      const parsed = await parseApiResponse<
        ResponseDataOf<T>,
        ResponseMetaOf<T>
      >(res);
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
    requestData?: RequestDataOf<T>,
    options?: Options
  ) => (await http.post<T>(url, requestData, options)).data,
  put: async <T extends WriteTypes>(
    url: string,
    requestData?: RequestDataOf<T>,
    options?: Options
  ) => (await http.put<T>(url, requestData, options)).data,
  patch: async <T extends WriteTypes>(
    url: string,
    requestData?: RequestDataOf<T>,
    options?: Options
  ) => (await http.patch<T>(url, requestData, options)).data,
};
