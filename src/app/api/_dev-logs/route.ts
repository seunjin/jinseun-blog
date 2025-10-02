// src/app/api/_dev-logs/route.ts
import {
  addClient,
  removeClient,
  makeClientFromController,
} from "@/lib/dev-log-bus";

// 개발 전용 SSE 엔드포인트
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not available in production", { status: 404 });
  }

  const { signal } = request;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const client = makeClientFromController(controller);
      addClient(client);

      // 연결 직후 확인 메시지
      client.send("✅ Connected to dev log stream");

      // 주석 프레임(: ping) → raw 전송으로 keep-alive
      const encoder = new TextEncoder();
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          /* noop */
        }
      }, 30_000);

      // 요청이 중단(abort)되면 정리
      signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        removeClient(client);
        try {
          client.close();
        } catch {
          /* noop */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // 프록시 버퍼링 방지
    },
  });
}
