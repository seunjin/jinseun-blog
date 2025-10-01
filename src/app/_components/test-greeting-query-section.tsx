"use client";

import { useState } from "react";
import { useTestGreeting } from "@/lib/hooks/use-test-greeting";

export function TestGreetingQuerySection() {
  const [name, setName] = useState("진세운");
  const { data, isLoading, isError, error, refetch, isFetching } =
    useTestGreeting(name);

  return (
    <section className="space-y-2 rounded border p-4">
      <h2 className="text-lg font-semibold">React Query – GET /api/test</h2>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border px-2 py-1"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="이름 입력"
        />
        <button
          className="rounded bg-blue-600 px-3 py-1 text-white"
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "로딩..." : "새로고침"}
        </button>
      </div>
      {isLoading ? (
        <p>불러오는 중...</p>
      ) : isError ? (
        <pre className="whitespace-pre-wrap text-sm text-red-500">
          {JSON.stringify(error, null, 2)}
        </pre>
      ) : data ? (
        <div className="text-sm">
          <p>{data.data.message}</p>
          <p className="text-gray-500">{data.data.time}</p>
        </div>
      ) : (
        <p>데이터가 없습니다.</p>
      )}
    </section>
  );
}
