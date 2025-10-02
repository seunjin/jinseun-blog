import type { HTTPError } from "ky";

/**
 * @description 성공 응답을 표현합니다.
 */
export type ApiSuccess<Data, Meta = undefined> = {
  /** 응답이 성공했는지 여부 */
  success: true;
  /** 성공 시 반환되는 주 데이터 */
  data: Data;
  /** 리스트/검색 등에 활용할 부가 메타 정보 */
  meta?: Meta;
  /** 사용자에게 전달 가능한 메시지 */
  message?: string;
  /** 서버가 내려준 상태 코드 (보통 2xx) */
  statusCode?: number;
  /** 로그 추적용 상관관계 ID */
  correlationId?: string;
};

/**
 * @description 실패 응답을 표현합니다.
 */
export type ApiFailure = {
  /** 응답이 실패했음을 나타냅니다 */
  success: false;
  /** 서버에서 내려온 에러 객체 */
  error: {
    /** 표준화된 에러 코드 */
    code: string;
    /** 사용자 혹은 개발자용 메시지 */
    message: string;
    /** 추가 디버깅 정보 */
    details?: unknown;
    /** 필드별 검증 메시지 */
    fields?: Record<string, string[]>;
  };
  /** 서버가 내려준 상태 코드 (보통 4xx/5xx) */
  statusCode: number;
  /** 최상위 메시지(선택사항) */
  message?: string;
  /** 로그 추적용 상관관계 ID */
  correlationId?: string;
};

/**
 * @description 성공/실패 응답 유니온 타입입니다.
 */
export type ApiResponse<Data = unknown, Meta = undefined> =
  | ApiSuccess<Data, Meta>
  | ApiFailure;

/**
 * @description ApiResponse가 성공인지 판별하는 타입 가드입니다.
 */
export function isOk<Data, Meta = unknown>(
  response: ApiResponse<Data, Meta>
): response is ApiSuccess<Data, Meta> {
  return response.success === true;
}

/**
 * @description 실패 응답을 표준 Error로 변환합니다.
 */
export class ApiError extends Error {
  code?: string;
  statusCode?: number;
  correlationId?: string;
  details?: unknown;
  fields?: Record<string, string[]>;

  constructor(failure: ApiFailure) {
    super(failure.error?.message ?? failure.message ?? "API Error");
    this.code = failure.error?.code;
    this.statusCode = failure.statusCode;
    this.correlationId = failure.correlationId;
    this.details = failure.error?.details;
    this.fields = failure.error?.fields;
  }
}

/**
 * @description 성공 응답이면 전체 성공 객체를 반환하고, 실패면 ApiError를 던집니다.
 */
export function ensureOk<Data, Meta = unknown>(
  response: ApiResponse<Data, Meta>
): ApiSuccess<Data, Meta> {
  if (isOk(response)) return response;
  throw new ApiError(response);
}

/**
 * @description 성공 응답에서 data만 추출합니다(편의용).
 */
export function unwrap<Data, Meta = unknown>(
  response: ApiResponse<Data, Meta>
): Data {
  return ensureOk(response).data;
}

/**
 * @description 내부 유틸: 대략적으로 ApiResponse 모양인지 판별
 */
function looksLikeApiResponse(x: any): x is ApiResponse<unknown, unknown> {
  return x && typeof x === "object" && "success" in x;
}

/**
 * @description HTTPError.response 바디를 실제로 파싱해 ApiFailure로 최대한 보존합니다.
 */
async function extractFailureFromHttpError(
  error: HTTPError
): Promise<ApiFailure> {
  const res = error.response;
  const status = res.status;
  const url = res.url;
  const statusText = res.statusText;
  const ctype = res.headers.get("content-type") || "";

  // 원문 텍스트 확보(JSON 파싱 실패 대비)
  let rawText = "";
  try {
    rawText = await res.clone().text();
  } catch {
    /* noop */
  }

  // JSON 시도
  if (ctype.includes("application/json")) {
    try {
      const json = JSON.parse(rawText);
      if (looksLikeApiResponse(json)) {
        if (json.success === false) {
          return json as ApiFailure;
        }
        // HTTP는 실패인데 바디는 성공인 예외 케이스
        return {
          success: false,
          statusCode: status,
          error: {
            code: "HTTP_ERROR_WITH_SUCCESS_BODY",
            message: "HTTP failed but body indicates success",
            details: { url, statusText, body: json },
          },
        };
      }
      // 우리 규약은 아니지만 JSON인 경우
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
      // content-type은 JSON이지만 파싱 실패 → 텍스트로 처리
    }
  }

  // 비 JSON/파싱 실패 → 텍스트 축약
  const msg = rawText?.trim?.();
  return {
    success: false,
    statusCode: status,
    error: {
      code: "UPSTREAM_TEXT_ERROR",
      message: msg ? msg.slice(0, 500) : "Upstream error",
      details: { url, statusText },
    },
  };
}

/**
 * @description ky 호출에서 던져진 unknown을 ApiError로 안전 변환(비동기 권장)
 * - HTTPError면 response body를 실제로 읽어 ApiFailure로 변환해서 보존합니다.
 * - 네트워크/기타 Error는 statusCode=0으로 통일합니다.
 */
export async function toApiErrorAsync(error: unknown): Promise<ApiError> {
  if (isHTTPError(error)) {
    const failure = await extractFailureFromHttpError(error);
    return new ApiError(failure);
  }
  return new ApiError({
    success: false,
    statusCode: 0,
    error: {
      code: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error,
    },
  });
}

/**
 * @description (레거시 호환) 동기 컨텍스트에서 쓸 수 있는 최소 변환기
 *  - HTTPError의 body를 읽지 못하므로 정보가 제한됩니다. 가능하면 toApiErrorAsync 사용 권장.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return new ApiError({
      success: false,
      statusCode: 0,
      error: { code: "UNKNOWN_ERROR", message: error.message, details: error },
    });
  }
  return new ApiError({
    success: false,
    statusCode: 0,
    error: { code: "UNKNOWN_ERROR", message: "Unknown error", details: error },
  });
}

function isHTTPError(error: unknown): error is HTTPError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "response" in error &&
      (error as HTTPError).name === "HTTPError"
  );
}

/**
 * @description ky의 Response 객체를 ApiResponse로 변환하는 도우미입니다.
 * - 서버가 ApiResponse 규약을 그대로 내려줄 때 사용합니다.
 * - 성공/실패 모두 JSON이 아닐 수도 있으므로 방어적으로 처리합니다.
 */
export async function parseApiResponse<Data, Meta = unknown>(
  response: Response
): Promise<ApiResponse<Data, Meta>> {
  const text = await response.text();
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
        details: {
          url: response.url,
          statusText: response.statusText,
        },
      },
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<Data, Meta>;
  } catch {
    return {
      success: false,
      statusCode: response.status,
      error: {
        code: "INVALID_JSON",
        message: "Response is not valid JSON",
        details: {
          url: response.url,
          raw: text.slice(0, 200),
        },
      },
    };
  }
}
