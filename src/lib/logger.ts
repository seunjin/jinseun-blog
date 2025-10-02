import { ApiError } from "./api-response";

// 서버/클라이언트 구분 (브라우저 콘솔 식별용)
const isServer = typeof window === "undefined";

// ---------------------------------------------------------------------------
// 환경 플래그
// ---------------------------------------------------------------------------

const NODE_ENV = process.env.NODE_ENV ?? "development";
const isProd = NODE_ENV === "production";
const isDev = !isProd;
// 서버/클라이언트 태그
const ORIGIN_TAG = isServer ? "[SERVER]" : "[CLIENT]";

// ---------------------------------------------------------------------------
// 사용 가이드
// ---------------------------------------------------------------------------

/**
 * logApiError는 ApiError/Unknown Error를 **환경별로 다르게 로깅**합니다.
 *
 * ## 호출 예시
 *
 * ### 로깅 후 전파
 * ```ts
 * try {
 *   await http.get("users");
 * } catch (error) {
 *   logApiError(error);
 *   throw error; // ErrorBoundary / error.tsx로 전파
 * }
 * ```
 *
 * ### 로깅 후 fallback 처리
 * ```ts
 * try {
 *   await http.get("users");
 * } catch (error) {
 *   logApiError(error);
 *   showToast("데이터 불러오기 실패");
 *   return []; // UI는 빈 목록으로 처리
 * }
 * ```
 *
 * ### 로깅 후 변환 던지기
 * ```ts
 * try {
 *   await http.get("users");
 * } catch (error) {
 *   logApiError(error);
 *   throw new Error("사용자 정보를 불러오지 못했습니다."); // UI 친화적 메시지
 * }
 * ```
 */

// ---------------------------------------------------------------------------
// 메인 함수
// ---------------------------------------------------------------------------

export function logApiError(error: unknown) {
  if (error instanceof ApiError) {
    const base = {
      message: error.message,
      code: error.code,
      status: error.statusCode,
      correlationId: error.correlationId,
      details: error.details,
      fields: error.fields,
    };

    if (isDev) {
      // 개발 환경: 상세 정보 + cause까지 출력
      // eslint-disable-next-line no-console
      console.error(`🚨 ${ORIGIN_TAG} ApiError`, base);
      if (error.cause) {
        // eslint-disable-next-line no-console
        console.error(`   ↳ ${ORIGIN_TAG} cause:`, error.cause);
      }
    } else {
      // 운영 환경: 최소 정보만 남기고, APM으로 전송
      // TODO: Sentry.captureException(error);
      // eslint-disable-next-line no-console
      console.error(`${ORIGIN_TAG} ApiError`, base);
    }
    // dev + server: 브라우저로도 스트리밍 포워딩 (SSE)
    if (isDev && isServer) {
      // 동적 임포트: 클라이언트 번들에 포함되지 않도록 서버에서만 로드
      import("./dev-log-bus")
        .then((m) => {
          try {
            const line =
              error instanceof ApiError
                ? `[ApiError] code=${error.code ?? "-"} status=${
                    error.statusCode ?? "-"
                  } msg=${error.message}`
                : `[Unknown] ${String(error)}`;
            m.pushDevLog(line);
          } catch {
            /* noop */
          }
        })
        .catch(() => {
          /* noop */
        });
    }
    return;
  }

  // ApiError가 아닌 일반 에러
  if (isDev) {
    // eslint-disable-next-line no-console
    console.error(`❓ ${ORIGIN_TAG} Unknown Error:`, error);
  } else {
    // TODO: Sentry.captureException(error as any);
    // eslint-disable-next-line no-console
    console.error(`${ORIGIN_TAG} Unknown Error`);
  }
  // dev + server: 브라우저로도 스트리밍 포워딩 (SSE)
  if (isDev && isServer) {
    // 동적 임포트: 클라이언트 번들에 포함되지 않도록 서버에서만 로드
    import("./dev-log-bus")
      .then((m) => {
        try {
          const line =
            error instanceof ApiError
              ? `[ApiError] code=${error.code ?? "-"} status=${
                  error.statusCode ?? "-"
                } msg=${error.message}`
              : `[Unknown] ${String(error)}`;
          m.pushDevLog(line);
        } catch {
          /* noop */
        }
      })
      .catch(() => {
        /* noop */
      });
  }
}
