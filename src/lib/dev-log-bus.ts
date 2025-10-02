// src/lib/dev-log-bus.ts
// 서버 전용 in-memory SSE 버스

type Client = {
  send: (message: string) => void;
  close: () => void;
};

const clients = new Set<Client>();
const encoder = new TextEncoder();

export function addClient(client: Client) {
  clients.add(client);
}

export function removeClient(client: Client) {
  clients.delete(client);
}

export function pushDevLog(message: string) {
  // 개발 모드에서만 동작
  if (process.env.NODE_ENV !== "development") return;
  for (const c of clients) {
    try {
      c.send(message);
    } catch {
      // 한 클라이언트 오류는 전체 브로드캐스트를 막지 않음
    }
  }
}

// SSE helper: controller에 한 줄 보내기
export function makeClientFromController(
  controller: ReadableStreamDefaultController<Uint8Array>
): Client {
  return {
    send(message: string) {
      controller.enqueue(encoder.encode(`data: ${message}\n\n`));
    },
    close() {
      try {
        controller.close();
      } catch {
        // noop
      }
    },
  };
}
