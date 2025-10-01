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
  response: ApiResponse<Data, Meta>,
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
 * @description 성공 응답이면 data를 반환하고, 실패면 ApiError를 던집니다.
 */
export function ensureOk<Data, Meta = unknown>(
  response: ApiResponse<Data, Meta>,
): ApiSuccess<Data, Meta> {
  if (isOk(response)) {
    return response;
  }

  throw new ApiError(response);
}

export function unwrap<Data, Meta = unknown>(
  response: ApiResponse<Data, Meta>,
): Data {
  return ensureOk(response).data;
}

/**
 * @description ky가 던지는 HTTPError를 ApiFailure 형태로 변환합니다.
 */
export function mapHttpErrorToApiFailure(error: HTTPError): ApiFailure {
  const { response } = error;
  return {
    success: false,
    statusCode: response.status,
    message: error.message,
    error: {
      code: "HTTP_ERROR",
      message: error.message,
      details: {
        url: response.url,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      },
    },
  };
}

/**
 * @description ky가 던질 수 있는 HTTPError를 ApiError로 바꿔 던집니다.
 */
export function mapHttpErrorToApiError(error: HTTPError): ApiError {
  return new ApiError(mapHttpErrorToApiFailure(error));
}

/**
 * @description ky 호출에서 HTTPError가 아닐 수도 있으므로 안전하게 변환합니다.
 */
export function toApiError(error: unknown): ApiError {
  if (isHTTPError(error)) {
    return mapHttpErrorToApiError(error);
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

function isHTTPError(error: unknown): error is HTTPError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "response" in error &&
      (error as HTTPError).name === "HTTPError",
  );
}

/**
 * @description ky의 Response 객체를 ApiResponse로 변환하는 도우미입니다.
 * - 서버가 ApiResponse 규약을 그대로 내려줄 때 사용합니다.
 */
export async function parseApiResponse<Data, Meta = unknown>(
  response: Response,
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
