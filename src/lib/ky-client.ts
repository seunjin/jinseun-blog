/**
 * @module ky-client
 * @description 공통 API 클라이언트와 타입/헬퍼를 제공합니다.
 */
import ky from "@toss/ky";
import type { KyInstance, Options, SearchParamsOption } from "ky";

const 기본옵션: Options = {
  prefixUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10_000,
  throwHttpErrors: false,
  // NOTE: Content-Type은 전역으로 고정하지 않습니다. JSON 요청은 ky가 json 옵션 사용 시 자동으로 'application/json'을 설정하고,
  // FormData 업로드 등은 브라우저가 boundary를 포함한 적절한 Content-Type을 설정해야 하므로 전역 설정을 피합니다.
  headers: {},
};

/**
 * @description 공통 API 호출을 위한 ky 인스턴스를 생성합니다. (전역 설정)
 * - `prefixUrl`, `timeout`, 공통 `headers` 등을 포함합니다.
 * - `Content-Type`은 전역으로 강제하지 않습니다. (요청 본문 타입에 따라 ky/브라우저가 자동 설정)
 *
 * @example
 * const res = await ky클라이언트.get('users/1');
 * const json = await res.json();
 */
export const ky클라이언트: KyInstance = ky.create(기본옵션);

/**
 * @description 필요 시 전역 옵션을 덮어쓰는 개별 ky 인스턴스를 생성합니다.
 * @param 옵션 - ky Options 확장 값 (기본 헤더/훅/타임아웃 등)
 * @returns KyInstance - 생성된 개별 인스턴스
 *
 * @example
 * const 인증클라이언트 = ky인스턴스생성({ headers: { Authorization: `Bearer ${token}` } });
 * const me = await 인증클라이언트.get('me').json();
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
 * @description 페이지네이션 관련 메타데이터를 느슨하게 표현하는 타입입니다.
 * - 서버별/엔드포인트별로 다른 메타 구조를 수용하기 위해 선택 필드로 구성했습니다.
 */
export type PaginatedMeta = {
  /** 현재 페이지 번호 */
  page?: number;
  /** 페이지당 아이템 수 */
  pageSize?: number;
  /** 전체 아이템 수 */
  total?: number;
  /** 전체 페이지 수 */
  totalPages?: number;
  /** 다음 페이지 존재 여부 */
  hasNext?: boolean;
  /** 이전 페이지 존재 여부 */
  hasPrev?: boolean;
  /** 다음 페이지를 가리키는 커서 */
  nextCursor?: string;
  /** 이전 페이지를 가리키는 커서 */
  prevCursor?: string;
  /** 추가 메타 정보를 담기 위한 확장 필드 */
  [key: string]: unknown;
};

/**
 * @description 성공 응답 형태 (success === true)
 * - 데이터(data)와 선택 메타(meta)를 포함합니다.
 */
export type ApiSuccess<Data, Meta = undefined> = {
  /** 응답이 성공했는지 여부 */
  success: true;
  /** 성공 시 반환되는 실제 데이터 */
  data: Data;
  /** 부가적인 메타 정보 */
  meta?: Meta;
  /** 사용자에게 전달할 수 있는 메시지 */
  message?: string;
  /** 서버에서 내려준 상태 코드 (보통 2xx) */
  statusCode?: number;
  /** 요청 추적을 위한 상관관계 ID */
  correlationId?: string;
};

/**
 * @description 실패 응답 형태 (success === false)
 * - 표준화된 에러 구조(error)를 제공합니다.
 */
export type ApiFailure = {
  /** 응답이 실패했음을 나타냅니다 */
  success: false;
  /** 실패 시 내려오는 에러 객체 */
  error: {
    /** 표준화된 에러 코드 */
    code: string;
    /** 사용자 또는 개발자 메시지 */
    message: string;
    /** 추가 진단 정보 */
    details?: unknown;
    /** 필드별 검증 메시지 */
    fields?: Record<string, string[]>;
  };
  /** 서버에서 내려준 상태 코드 (보통 4xx/5xx) */
  statusCode: number;
  /** 상위 수준의 메시지 */
  message?: string;
  /** 요청 추적을 위한 상관관계 ID */
  correlationId?: string;
};

/**
 * @description 성공/실패 응답을 포괄하는 유니온 타입입니다.
 * @example
 * function handle(res: ApiResponse<User>) {
 *   if (res.success) console.log(res.data);
 *   else console.error(res.error.code, res.error.message);
 * }
 */
export type ApiResponse<Data = unknown, Meta = unknown> =
  | ApiSuccess<Data, Meta>
  | ApiFailure;

/**
 * @description ApiResponse가 성공인지 판별하는 타입 가드입니다.
 * @param response - ApiResponse<Data, Meta>
 * @returns response is ApiSuccess<Data, Meta>
 * @example
 * if (isOk(res)) { console.log(res.data); }
 */
export function isOk<Data, Meta = unknown>(
  response: ApiResponse<Data, Meta>,
): response is ApiSuccess<Data, Meta> {
  return response.success;
}

/**
 * @description 실패 응답(ApiFailure)을 표준 Error로 변환하는 클래스입니다.
 * @example
 * try { const data = unwrap(res); } catch (e) { if (e instanceof ApiError) toast.error(e.message); }
 */
export class ApiError extends Error {
  /** 표준화된 에러 코드 */
  code?: string;
  /** HTTP 상태 코드 */
  statusCode?: number;
  /** 요청 추적을 위한 상관관계 ID */
  correlationId?: string;
  /** 추가 진단 정보 */
  details?: unknown;
  /** 필드별 검증 메시지 */
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
 * @description ApiResponse 객체에서 실제 데이터만 안전하게 추출합니다.
 * 성공 응답(success: true)일 경우 data 필드를 반환하고,
 * 실패 응답(success: false)일 경우 ApiError를 생성해 예외를 던집니다.
 *
 * 이 함수를 사용하면 호출부에서는 항상 성공 시의 Data 타입만 다루게 되며,
 * 실패 상황은 try/catch 구문이나 상위 에러 핸들러에서 처리할 수 있습니다.
 *
 * 예시:
 * const user = unwrap(await http.get<User>('/users/123'));
 * // user는 User 타입으로 안전하게 사용 가능, 실패 시 ApiError 발생
 */
export function unwrap<Data, Meta = unknown>(
  response: ApiResponse<Data, Meta>,
): Data {
  if (isOk(response)) {
    return response.data;
  }

  throw new ApiError(response);
}

/**
 * @description `unwrap`의 한글 별칭. 성공 시 데이터만 반환, 실패 시 ApiError 던짐.
 */
export const 데이터꺼내기 = unwrap;

/**
 * @description GET/DELETE에서 사용할 쿼리 파라미터 타입 (ky의 SearchParamsOption)
 * - 객체/문자열/URLSearchParams/튜플배열 모두 허용
 * @example
 * http.get('users', { page: 1, q: 'abc' });
 * http.get('users', new URLSearchParams({ q: 'abc' }));
 */
export type Query = SearchParamsOption;

/**
 * @description SearchParamsOption 값을 URLSearchParams로 정규화합니다.
 */
function toURLSearchParams(
  value?: SearchParamsOption,
): URLSearchParams | undefined {
  if (!value) return undefined;
  if (value instanceof URLSearchParams) return value;
  if (Array.isArray(value)) return new URLSearchParams(value as any);
  if (typeof value === "string") return new URLSearchParams(value);
  return new URLSearchParams(value as Record<string, string>);
}

/**
 * @description 두 SearchParamsOption을 병합합니다. (앞의 값 + 뒤의 값; 뒤 값이 우선)
 */
function mergeSearchParams(
  base?: SearchParamsOption,
  override?: SearchParamsOption,
): URLSearchParams | undefined {
  if (!base && !override) return undefined;
  const a = toURLSearchParams(base) ?? new URLSearchParams();
  const b = toURLSearchParams(override);
  if (!b) return a;
  // b가 우선권: 같은 키면 b 값으로 교체
  for (const [k] of a.entries()) {
    if (b.has(k)) a.delete(k);
  }
  for (const [k, v] of b.entries()) a.append(k, v);
  return a;
}

/**
 * @description 실제 JSON 규격만 허용하기 위한 재귀 타입 정의
 * - JSON 본문을 보낼 때 타입 안정성을 높이기 위해 사용합니다.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/**
 * @description JSON 옵션을 안전하게 구성하기 위한 헬퍼
 */
function buildJsonOptions<Body extends Json = Json>(
  body: Body | undefined,
  options?: Options,
): Options {
  const requestOptions: Options = { ...options };
  if (typeof body !== "undefined") {
    requestOptions.json = body as unknown;
  } else if (typeof options?.json !== "undefined") {
    requestOptions.json = options.json;
  } else if ("json" in requestOptions) {
    delete (requestOptions as Record<string, unknown>).json;
  }

  return requestOptions;
}

/** 스칼라 필드 값 (FormData 필드에 문자열로 들어갈 값) */
type ScalarField = string | number | boolean | null | Date;

/** 파일 유사 타입 */
type FileLike = File | Blob | ArrayBuffer | Uint8Array;

/** 멀티파트 페이로드 정의 */
/**
 * @description multipart/form-data 페이로드를 선언적으로 표현하는 타입입니다.
 * - fields: 스칼라 값을 문자열로 전송 (undefined 생략, null은 'null', Date는 ISO)
 * - listFields: 같은 키로 여러 값 append
 * - json: JSON을 특정 키(jsonKey, 기본 'metadata')에 문자열로 append
 * - files: 파일/바이너리(여러 개 가능)
 */
export type MultipartPayload = {
  /** key-value 스칼라 필드. undefined는 생략, null은 'null', Date는 ISO 문자열 */
  fields?: Record<string, ScalarField | undefined>;
  /** 배열 필드: 같은 키로 여러 값을 append */
  listFields?: Record<string, ScalarField[] | undefined>;
  /** JSON 객체를 문자열로 넣고 싶은 경우 */
  json?: unknown;
  /** json을 넣을 필드명 (기본 'metadata') */
  jsonKey?: string;
  /** 파일/바이너리. 배열을 넘기면 여러 파일을 같은 키로 append */
  files?: Record<
    string,
    FileLike | (FileLike | null | undefined)[] | null | undefined
  >;
};

function toStringValue(v: ScalarField): string {
  if (v === null) return "null";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const { buffer, byteOffset, byteLength } = u8;
  if (buffer instanceof ArrayBuffer) {
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  // Fallback for ArrayBufferLike/SharedArrayBuffer: copy to a fresh ArrayBuffer
  const copy = new Uint8Array(u8);
  return copy.buffer;
}

function appendFile(
  fd: FormData,
  key: string,
  value: FileLike,
  filename?: string,
) {
  if (value instanceof Blob) {
    const name =
      filename ??
      (typeof File !== "undefined" && value instanceof File
        ? value.name
        : "blob");
    fd.append(key, value, name);
    return;
  }
  if (value instanceof ArrayBuffer) {
    fd.append(key, new Blob([value]), filename ?? "file");
    return;
  }
  if (value instanceof Uint8Array) {
    fd.append(key, new Blob([u8ToArrayBuffer(value)]), filename ?? "file");
    return;
  }
  // fallback: 문자열로 처리
  fd.append(key, String(value));
}

/**
 * @description 다양한 입력을 받아 FormData로 변환합니다.
 * @example
 * const fd = toFormData({
 *   json: { title: '테스트' },
 *   files: { image: file },
 *   fields: { isPublic: true },
 *   listFields: { categoryIds: [1,2,3] },
 * });
 */
export function toFormData(
  payload: MultipartPayload,
  init?: FormData,
): FormData {
  const fd = init ?? new FormData();

  if (payload.fields) {
    for (const [k, v] of Object.entries(payload.fields)) {
      if (typeof v === "undefined") continue;
      fd.append(k, toStringValue(v));
    }
  }

  if (payload.listFields) {
    for (const [k, arr] of Object.entries(payload.listFields)) {
      if (!arr) continue;
      for (const v of arr) {
        if (typeof v === "undefined") continue;
        fd.append(k, toStringValue(v));
      }
    }
  }

  if (typeof payload.json !== "undefined") {
    const key = payload.jsonKey ?? "metadata";
    fd.append(key, JSON.stringify(payload.json));
  }

  if (payload.files) {
    for (const [k, val] of Object.entries(payload.files)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item == null) continue;
          appendFile(fd, k, item);
        }
      } else if (val != null) {
        appendFile(fd, k, val);
      }
    }
  }

  return fd;
}

/**
 * @description Response를 ApiResponse로 안전 변환합니다.
 * - 빈 본문(204 포함)은 success:true, data: undefined로 처리
 * - JSON 파싱 실패는 INVALID_JSON 오류로 래핑
 */
async function parseApiJson<Data, Meta = unknown>(
  res: Response,
): Promise<ApiResponse<Data, Meta>> {
  const status = res.status;
  const text = await res.text();

  // 본문이 비어있는 경우(예: 204 No Content)
  if (!text) {
    return {
      success: true,
      // data가 의미 없을 수 있으므로 void로 캐스팅
      data: undefined as unknown as Data,
      statusCode: status,
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<Data, Meta>;
  } catch {
    return {
      success: false,
      statusCode: status,
      error: {
        code: "INVALID_JSON",
        message: "Response is not valid JSON",
        details: { raw: text?.slice(0, 200) },
      },
    } as ApiResponse<Data, Meta>;
  }
}

/**
 * @description 공통 HTTP 메소드 헬퍼 모음입니다.
 *
 * - 병합 규칙: searchParams는 options→인자 순으로 병합(인자가 우선), JSON 본문은 인자 body가 options.json보다 우선합니다.
 *
 * @example
 * const users = await http.get<User[]>('users', { page: 1 });
 * const created = await http.post<User>('users', { name: '홍길동' });
 * const updated = await http.put<User>('users/1', { name: '김철수' });
 * const deleted = await http.delete('users/1');
 * const formResult = await http.postForm('upload', formData);
 * const multipartResult = await http.postMultipart('upload', { files: { file: myFile } });
 */
export const http = {
  /**
   * @description GET 요청
   * @example
   * const res = await http.get<User[]>('users', { page: 1 });
   */
  get: async <Data, Meta = unknown>(
    url: string,
    query?: Query,
    options?: Options,
  ) =>
    ky클라이언트
      .get(url, {
        ...options,
        searchParams: mergeSearchParams(options?.searchParams, query),
      })
      .then((res) => parseApiJson<Data, Meta>(res)),

  /**
   * @description DELETE 요청
   * @example
   * const res = await http.delete('users/1');
   */
  delete: async <Data, Meta = unknown>(
    url: string,
    query?: Query,
    options?: Options,
  ) =>
    ky클라이언트
      .delete(url, {
        ...options,
        searchParams: mergeSearchParams(options?.searchParams, query),
      })
      .then((res) => parseApiJson<Data, Meta>(res)),

  /**
   * @description POST(JSON) 요청
   * @example
   * const res = await http.post<User>('users', { name: '홍길동' });
   */
  post: async <Data, Body extends Json = Json, Meta = unknown>(
    url: string,
    body?: Body,
    options?: Options,
  ) =>
    ky클라이언트
      .post(url, buildJsonOptions(body, options))
      .then((res) => parseApiJson<Data, Meta>(res)),

  /**
   * @description PUT(JSON) 요청
   * @example
   * const res = await http.put<User>('users/1', { name: '김철수' });
   */
  put: async <Data, Body extends Json = Json, Meta = unknown>(
    url: string,
    body?: Body,
    options?: Options,
  ) =>
    ky클라이언트
      .put(url, buildJsonOptions(body, options))
      .then((res) => parseApiJson<Data, Meta>(res)),

  /**
   * @description PATCH(JSON) 요청
   * @example
   * const res = await http.patch<User>('users/1', { name: '이영희' });
   */
  patch: async <Data, Body extends Json = Json, Meta = unknown>(
    url: string,
    body?: Body,
    options?: Options,
  ) =>
    ky클라이언트
      .patch(url, buildJsonOptions(body, options))
      .then((res) => parseApiJson<Data, Meta>(res)),

  /**
   * @description POST(FormData) 요청
   * @example
   * const res = await http.postForm('upload', formData);
   */
  postForm: async <Data, Meta = unknown>(
    url: string,
    form: BodyInit,
    options?: Options,
  ) =>
    ky클라이언트
      .post(url, { ...options, body: form })
      .then((res) => parseApiJson<Data, Meta>(res)),

  /**
   * @description PUT(FormData) 요청
   * @example
   * const res = await http.putForm('upload/1', formData);
   */
  putForm: async <Data, Meta = unknown>(
    url: string,
    form: BodyInit,
    options?: Options,
  ) =>
    ky클라이언트
      .put(url, { ...options, body: form })
      .then((res) => parseApiJson<Data, Meta>(res)),

  /**
   * @description PATCH(FormData) 요청
   * @example
   * const res = await http.patchForm('upload/1', formData);
   */
  patchForm: async <Data, Meta = unknown>(
    url: string,
    form: BodyInit,
    options?: Options,
  ) =>
    ky클라이언트
      .patch(url, { ...options, body: form })
      .then((res) => parseApiJson<Data, Meta>(res)),

  /**
   * @description JSON + 파일 멀티파트 요청
   * @example
   * const res = await http.postMultipart('upload', {
   *   json: { title: '제목' },
   *   files: { image: file },
   * });
   */
  postMultipart: async <Data, Meta = unknown>(
    url: string,
    payload: MultipartPayload,
    options?: Options,
  ) =>
    ky클라이언트
      .post(url, { ...options, body: toFormData(payload) })
      .then((res) => parseApiJson<Data, Meta>(res)),

  /**
   * @description JSON + 파일 멀티파트 요청
   * @example
   * const res = await http.putMultipart('upload/1', {
   *   json: { title: '수정된 제목' },
   *   files: { image: file },
   * });
   */
  putMultipart: async <Data, Meta = unknown>(
    url: string,
    payload: MultipartPayload,
    options?: Options,
  ) =>
    ky클라이언트
      .put(url, { ...options, body: toFormData(payload) })
      .then((res) => parseApiJson<Data, Meta>(res)),

  /**
   * @description JSON + 파일 멀티파트 요청
   * @example
   * const res = await http.patchMultipart('upload/1', {
   *   json: { title: '부분 수정 제목' },
   *   files: { image: file },
   * });
   */
  patchMultipart: async <Data, Meta = unknown>(
    url: string,
    payload: MultipartPayload,
    options?: Options,
  ) =>
    ky클라이언트
      .patch(url, { ...options, body: toFormData(payload) })
      .then((res) => parseApiJson<Data, Meta>(res)),
};
