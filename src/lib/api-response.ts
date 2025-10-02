import type { HTTPError } from "ky";

/**
 * @module api-response
 * @description
 * API 응답 규약과 에러 변환/파싱 유틸리티를 제공합니다.
 *
 * # 설계 의도
 * - 서버 ↔ 클라이언트 간 **명확한 계약(Contract)**을 코드로 고정합니다.
 * - 성공/실패 응답을 **한 가지 형태**로 표준화하여 호출부 복잡도를 줄입니다.
 * - ky의 HTTPError와 비표준 응답(JSON 아님, 빈 바디 등)을 **안전하게 흡수**합니다.
 * - 운영 단계에서 **원인 추적(cause 체인)**이 가능하도록 Error를 구성합니다.
 *
 * # 응답 규약
 * - 성공: `{ success: true, data, meta?, message?, statusCode?, correlationId? }`
 * - 실패: `{ success: false, statusCode, message?, correlationId?, error: { code, message, details?, fields? } }`
 *
 * # 사용 팁
 * - `ensureOk()`로 성공/실패를 한 번에 분기하세요. 실패 시 `ApiError`가 던져집니다.
 * - UI에서 데이터만 필요하면 `unwrap()`을 사용하세요.
 * - 네트워크/HTTP 실패는 `toApiErrorAsync()`로 **항상 ApiError**로 표준화됩니다(원인 `cause` 포함).
 *
 */

// ---------------------------------------------------------------------------
// 타입 정의 (Type Definitions)
// ---------------------------------------------------------------------------

/**
 * @description 성공 응답 형태를 표현합니다.
 * @typeParam Data - 실제 비즈니스 데이터 타입(예: User, Post[], etc.)
 * @typeParam Meta - 페이징/정렬/카운트 등 부가 메타 정보 타입
 */
export type ApiSuccess<Data, Meta = undefined> = {
  /** 성공 여부 (항상 true) */
  success: true;
  /** 성공 시 반환되는 주 데이터 */
  data: Data;
  /** 부가 메타 정보(페이지네이션 등) */
  meta?: Meta;
  /** 사용자 혹은 상위 레이어에 전달 가능한 메시지 */
  message?: string;
  /** 서버가 내려준 상태 코드(보통 2xx). 일부 런타임에서 누락될 수 있습니다. */
  statusCode?: number;
  /** 로그 추적용 상관관계 ID(서버 로깅과 매칭) */
  correlationId?: string;
};

/**
 * @description 실패 응답 형태를 표현합니다.
 * - 서버는 반드시 일관된 `code`/`message`를 내려주어야 합니다.
 */
export type ApiFailure = {
  /** 실패 여부 (항상 false) */
  success: false;
  /** 서버가 내려준 상태 코드(보통 4xx/5xx) */
  statusCode: number;
  /** 최상위 메시지(선택). 보통 `error.message`를 그대로 사용합니다. */
  message?: string;
  /** 로그 추적용 상관관계 ID(서버 로깅과 매칭) */
  correlationId?: string;
  /** 구체적인 오류 객체 */
  error: {
    /** 표준화된 에러 코드(예: INVALID_INPUT, UNAUTHORIZED) */
    code: string;
    /** 사용자/개발자용 메시지 */
    message: string;
    /** 추가 디버깅 정보(원문 응답, 헤더, URL 등 자유 형식) */
    details?: unknown;
    /** 필드별 검증 오류 (예: { email: ["형식이 올바르지 않습니다."] }) */
    fields?: Record<string, string[]>;
  };
};

/**
 * @description API 응답의 유니온 타입(성공 또는 실패)
 */
export type ApiResponse<Data = unknown, Meta = undefined> =
  | ApiSuccess<Data, Meta>
  | ApiFailure;

// ---------------------------------------------------------------------------
// 판별 및 편의 함수 (Guards & Helpers)
// ---------------------------------------------------------------------------

/**
 * @description ApiResponse가 성공인지 여부를 판별합니다.
 */
export function isOk<Data, Meta = unknown>(
  response: ApiResponse<Data, Meta>
): response is ApiSuccess<Data, Meta> {
  return response.success === true;
}

/**
 * @description 성공 응답이면 전체 성공 객체를 반환하고, 실패면 ApiError를 던집니다.
 * @example
 * const ok = ensureOk(await parseApiResponse<User>(res));
 * // ok.data, ok.meta 사용 가능
 */
export function ensureOk<Data, Meta = unknown>(
  response: ApiResponse<Data, Meta>
): ApiSuccess<Data, Meta> {
  if (isOk(response)) return response;
  throw new ApiError(response);
}

/**
 * @description 성공 응답에서 data만 추출합니다(편의용).
 * @example
 * const user = unwrap(await parseApiResponse<User>(res));
 */
export function unwrap<Data, Meta = unknown>(
  response: ApiResponse<Data, Meta>
): Data {
  return ensureOk(response).data;
}

// ---------------------------------------------------------------------------
// ApiError (운영 친화적 Error: cause 체인 유지)
// ---------------------------------------------------------------------------

/**
 * @description ApiFailure를 감싸는 표준 Error
 * - `cause`를 통해 원인 Error(HTTPError, 네트워크 Error 등) 체인을 유지합니다.
 * - 로깅/모니터링(Sentry 등)에서 원인 추적이 쉬워집니다.
 */
export class ApiError extends Error {
  /** 표준화된 에러 코드 */
  code?: string;
  /** HTTP 상태 코드(0=네트워크/알 수 없음) */
  statusCode?: number;
  /** 상관관계 ID(서버 로깅 매칭) */
  correlationId?: string;
  /** 추가 디버깅 정보(원문 응답 일부 등) */
  details?: unknown;
  /** 필드별 검증 오류 */
  fields?: Record<string, string[]>;

  constructor(failure: ApiFailure, cause?: unknown) {
    super(failure.error?.message ?? failure.message ?? "API Error", { cause });
    this.name = "ApiError";
    this.code = failure.error?.code;
    this.statusCode = failure.statusCode;
    this.correlationId = failure.correlationId;
    this.details = failure.error?.details;
    this.fields = failure.error?.fields;
  }
}

// ---------------------------------------------------------------------------
// ky 에러 → ApiError 변환 (HTTP/네트워크 실패를 표준화)
// ---------------------------------------------------------------------------

/**
 * @description ky 호출에서 발생한 unknown을 **정보 손실 없이** ApiError로 변환합니다(권장).
 * - HTTPError의 Response Body를 실제로 읽어 `ApiFailure`로 최대한 보존합니다.
 * - 네트워크/기타 Error는 statusCode=0, code=UNKNOWN_ERROR 로 통일합니다.
 * - 원본 에러는 항상 `cause`로 체인합니다.
 */
export async function toApiError(error: unknown): Promise<ApiError> {
  if (isHTTPError(error)) {
    const failure = await extractFailureFromHttpError(error);
    return new ApiError(failure, error);
  }
  return new ApiError(
    {
      success: false,
      statusCode: 0,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
    },
    error
  );
}

// ---------------------------------------------------------------------------
// 내부 유틸 (Internal Utilities)
// ---------------------------------------------------------------------------

/**
 * @description 대략적으로 ApiResponse 모양인지 판별합니다.
 * - JSON:API 등 다른 규격과 혼용 시 방어적으로만 사용합니다.
 */
function looksLikeApiResponse(payload: unknown): payload is ApiResponse {
  if (!payload || typeof payload !== "object") return false;
  return "success" in (payload as Record<string, unknown>);
}

/**
 * @description ky의 HTTPError 타입 판별
 */
function isHTTPError(error: unknown): error is HTTPError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "response" in error &&
      (error as HTTPError).name === "HTTPError"
  );
}

/**
 * @description HTTPError.response의 바디를 읽어 `ApiFailure`로 변환합니다.
 * - `application/json`이면 JSON 파싱을 시도하고, 실패 시 텍스트로 대체합니다.
 * - JSON이 우리 규약이 아니어도(외부 API) 최대한 정보를 보존해 `details`로 전달합니다.
 * - **빈 바디/HTML 에러 페이지** 등도 텍스트 요약으로 안전 처리합니다.
 */
async function extractFailureFromHttpError(
  error: HTTPError
): Promise<ApiFailure> {
  const res = error.response;
  const status = res.status;
  const url = res.url;
  const statusText = res.statusText;
  const contentType = res.headers.get("content-type") || "";

  // 원문 텍스트 확보(JSON 파싱 실패 대비)
  let rawText = "";
  try {
    rawText = await res.clone().text();
  } catch {
    /* noop */
  }

  // JSON 응답 시도
  if (contentType.includes("application/json")) {
    try {
      const json = JSON.parse(rawText);

      // 서버가 이미 우리 규약을 따르는 경우
      if (looksLikeApiResponse(json)) {
        if (json.success === false) return json as ApiFailure;
        // HTTP는 실패인데, 바디는 성공 형태로 온 비일관 케이스
        return {
          success: false,
          statusCode: status,
          error: {
            code: "UPSTREAM_INCONSISTENT",
            message: "HTTP error but body indicated success",
            details: { url, statusText, body: json },
          },
        };
      }

      // JSON이지만 우리 규약이 아닌 경우(외부 API 등)
      return {
        success: false,
        statusCode: status,
        error: {
          code: "UPSTREAM_JSON_ERROR",
          message:
            (json?.error?.message as string) ||
            (json?.message as string) ||
            "Upstream JSON error",
          details: { url, statusText, body: json },
        },
      };
    } catch {
      // content-type은 JSON이지만 파싱 실패 → 텍스트 처리로 폴백
      /* fallthrough to text */
    }
  }

  // 비 JSON/파싱 실패 → 텍스트 응답을 요약
  const message = rawText?.trim?.();
  return {
    success: false,
    statusCode: status,
    error: {
      code: "UPSTREAM_TEXT_ERROR",
      message: message ? message.slice(0, 500) : "Upstream error",
      details: { url, statusText },
    },
  };
}

// ---------------------------------------------------------------------------
// Response 파서 (Parse Response → ApiResponse)
// ---------------------------------------------------------------------------

/**
 * @description ky Response를 읽어 우리 규약의 `ApiResponse`로 변환합니다.
 * - 성공/실패 모두 JSON이 아닐 수 있으므로 방어적으로 처리합니다.
 * - 서버가 우리 규약을 따르는 것을 전제로 하나, 실제 운영에서는
 *   게이트웨이/프록시/외부 API 등으로 인한 변형을 고려해 예외 경로를 감쌉니다.
 *
 * @example
 * const res = await ky.get("users/1");
 * const parsed = await parseApiResponse<User>(res);
 * const ok = ensureOk(parsed);
 * return ok.data;
 */
export async function parseApiResponse<Data, Meta = unknown>(
  response: Response
): Promise<ApiResponse<Data, Meta>> {
  const text = await response.text();

  // 바디가 비어있는 경우(204, 혹은 일부 프록시/게이트웨이 에러)
  if (!text) {
    if (response.ok) {
      return {
        success: true,
        data: undefined as unknown as Data,
        statusCode: response.status,
      };
    }
    return {
      success: false,
      statusCode: response.status,
      error: {
        code: "EMPTY_ERROR_BODY",
        message: "Empty response body",
        details: { url: response.url, statusText: response.statusText },
      },
    };
  }

  // JSON 파싱 시도
  try {
    return JSON.parse(text) as ApiResponse<Data, Meta>;
  } catch {
    // JSON이 아닌데 성공 상태였다면 서버 컨벤션 위반 가능성이 높습니다.
    // 실패로 취급하여 상위에서 일관되게 처리할 수 있도록 합니다.
    return {
      success: false,
      statusCode: response.status,
      error: {
        code: "INVALID_JSON",
        message: "Response is not valid JSON",
        details: { url: response.url, raw: text.slice(0, 200) },
      },
    };
  }
}

// ---------------------------------------------------------------------------
// 실무 가이드 (Practical Guide)
// ---------------------------------------------------------------------------

/**
 * ## 호출부 권장 패턴
 *
 * ### 1) 표준 성공 핸들링
 * ```ts
 * const res = await ky클라이언트.get("users");
 * const ok = ensureOk(await parseApiResponse<User[]>(res));
 * return ok.data; // meta가 필요하면 ok.meta 사용
 * ```
 *
 * ### 2) 표준 실패 핸들링(서비스/훅 상위에서 한 번만)
 * ```ts
 * try {
 *   const res = await ky클라이언트.get("users/boom");
 *   const ok  = ensureOk(await parseApiResponse<User>(res));
 *   return ok.data;
 * } catch (e) {
 *   const err = await toApiErrorAsync(e);
 *   // err instanceof ApiError
 *   console.error(err.code, err.message, err.statusCode, err.cause);
 *   throw err; // UI 레이어로 전파
 * }
 * ```
 *
 * ### 3) React Query에서 data만 필요할 때
 * ```ts
 * const { data: users } = useQuery({
 *   queryKey: ["users"],
 *   queryFn: async () => {
 *     const res = await ky클라이언트.get("users");
 *     const ok  = ensureOk(await parseApiResponse<User[]>(res));
 *     return ok.data;
 *   },
 * });
 * ```
 *
 * ## 엣지 케이스
 * - **게이트웨이/리버스프록시가 HTML 에러 페이지**를 내려보내는 경우 → `UPSTREAM_TEXT_ERROR`로 표준화됩니다.
 * - **content-type이 JSON인데 실제로는 텍스트**인 경우 → JSON 파싱 실패 후 텍스트 경로로 폴백합니다.
 * - **성공(2xx)인데 규약이 아닌 바디** → 서버 컨벤션 점검 권장. 필요 시 `parseApiResponse`를 커스터마이즈하세요.
 *
 * ## 운영 팁
 * - `ApiError`는 `cause`에 원인 에러(HTTPError 등)를 유지합니다. 로깅/관측(Monitoring)에서 체인 추적이 쉽습니다.
 * - `correlationId`를 서버에서 꼭 남겨주세요. 프론트 로그와 서버 로그를 빠르게 매칭할 수 있습니다.
 */
