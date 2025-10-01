/**
 * @module ky-client
 * @description 공통 API 클라이언트(균형형, Balanced)와 최소 헬퍼를 제공합니다.
 *
 * # 설계 방향
 * - ky의 기본 동작을 신뢰합니다. (단순, 예측 가능)
 * - 공통 옵션은 create 시 한 번만 적용하고, 각 메소드는 얇게 감쌉니다.
 * - 에러는 ky가 throw(throwHttpErrors: true). 서비스 계층에서 try/catch로 표준화합니다.
 * - 쿼리 병합/정규화 로직은 제공하지 않습니다. 호출부에서 SearchParamsOption을 그대로 넘겨주세요.
 * - 멀티파트 업로드는 단 1개 메소드(postMultipart)만 제공합니다.
 *
 * # 프로젝트 기본 규칙 반영
 * 1. 한글로 소통합니다. (기술 용어는 영어 그대로 사용)
 * 2. 한글 변수명/함수명을 허용합니다. (필요 시 영어 병행 가능)
 * 3. JSDoc은 한글로 꼼꼼하게 작성합니다.
 * 4. 타입(인터페이스/타입)은 영어로 정의하되, 각 필드의 의미를 한글 주석으로 설명합니다.
 */

import ky from "@toss/ky";
import type { KyInstance, Options } from "ky";
import { ApiResponse, ensureOk, toApiError } from "./api-response";

/**
 * 서버(Node)에서는 절대 URL이 필요하고, 브라우저에서는 상대 경로 허용
 */
const isServer = typeof window === "undefined";
/**
 * API Origin 우선순위
 * 1. NEXT_PUBLIC_API_ORIGIN – Next + Supabase가 공유하는 1차 도메인
 * 2. NEXT_PUBLIC_API_BASE_URL – 기존 설정 호환용
 * 3. NEXT_PUBLIC_SITE_URL – Vercel 환경에서 제공하는 사이트 URL
 * 4. NEXT_PUBLIC_SUPABASE_URL – Supabase 프로젝트 기본 도메인
 * 5. VERCEL_URL – 배포 중인 프리뷰 URL 등
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
  /**
   * 실패(4xx/5xx)는 ky가 예외를 던집니다.
   * - 서비스/훅/컴포넌트 등 상위 계층에서 try/catch로 표준화하세요.
   */
  throwHttpErrors: true,
  /**
   * Content-Type은 전역으로 강제하지 않습니다.
   * - JSON 요청: { json: body } 사용 시 ky가 자동으로 'application/json'을 설정합니다.
   * - FormData 업로드: 브라우저/런타임이 boundary 포함 헤더를 자동 설정하므로 건드리지 않습니다.
   */
  headers: {},
};

/**
 * @description 공통 API 호출을 위한 ky 인스턴스(전역)입니다.
 * @example
 * const res = await ky클라이언트.get('users/1');
 * const data = await res.json<User>();
 */
export const ky클라이언트: KyInstance = ky.create(기본옵션);

/**
 * @description 필요 시 전역 옵션을 덮어쓰는 개별 ky 인스턴스를 생성합니다.
 * @param 옵션 - ky Options 확장 값 (기본 헤더/훅/타임아웃 등)
 * @returns KyInstance - 생성된 개별 인스턴스
 * @example
 * const 인증클라이언트 = ky인스턴스생성({ headers: { Authorization: `Bearer ${token}` } });
 * const me = await 인증클라이언트.get('me').json<User>();
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

/**
 * @description HTTP 메소드별 최소 헬퍼 모음 (얇은 래퍼)
 *
 * ## 사용 가이드
 * - 쿼리 파라미터는 ky의 `SearchParamsOption` 그대로 전달하세요.
 *   ```ts
 *   http.get<User[]>("users", { searchParams: { page: 1, q: "abc" } })
 *   http.get<User[]>("users", { searchParams: new URLSearchParams([["tag","a"],["tag","b"]]) })
 *   ```
 * - 실패(4xx/5xx)는 예외로 던져지므로 호출부에서 처리하세요.
 *   ```ts
 *   try {
 *     const users = await http.get<User[]>("users", {
 *       searchParams: { page: 1 },
 *     });
 *   } catch (error) {
 *     throw toAppError(error); // mapHttpErrorToApiError 등으로 변환
 *   }
 *   ```
 * - 멀티파트 업로드는 FormData를 직접 준비해 전달합니다.
 *   ```ts
 *   const form = new FormData();
 *   form.append("metadata", JSON.stringify({ title: "사진" }));
 *   form.append("file", file);
 *   const result = await ky클라이언트.post("upload", { body: form }).json<UploadResult>();
 *   ```
 */

export const http = {
  /**
   * @description GET 요청
   * @example
   * const users = await http.get<User[]>("users", { searchParams: { page: 1 } });
   */
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

  /**
   * @description DELETE 요청
   * @example
   * await http.delete<void>("users/1");
   */
  delete: <T>(url: string, options?: Options) =>
    ky클라이언트.delete(url, options).json<ApiResponse<T>>(),

  /**
   * @description POST(JSON) 요청 — Content-Type은 ky가 자동 설정
   * @example
   * const created = await http.post<User, { name: string }>("users", { name: "홍길동" });
   */
  post: <T, B = unknown>(url: string, body?: B, options?: Options) =>
    (body !== undefined
      ? ky클라이언트.post(url, { ...options, json: body })
      : ky클라이언트.post(url, options)
    ).json<ApiResponse<T>>(),

  /**
   * @description PUT(JSON) 요청 — Content-Type은 ky가 자동 설정
   */
  put: <T, B = unknown>(url: string, body?: B, options?: Options) =>
    (body !== undefined
      ? ky클라이언트.put(url, { ...options, json: body })
      : ky클라이언트.put(url, options)
    ).json<ApiResponse<T>>(),

  /**
   * @description PATCH(JSON) 요청 — Content-Type은 ky가 자동 설정
   */
  patch: <T, B = unknown>(url: string, body?: B, options?: Options) =>
    (body !== undefined
      ? ky클라이언트.patch(url, { ...options, json: body })
      : ky클라이언트.patch(url, options)
    ).json<ApiResponse<T>>(),
};
