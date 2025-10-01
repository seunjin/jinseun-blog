import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API 테스트 페이지",
};

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">API 테스트</h1>
      <Suspense fallback={<p>불러오는 중...</p>}></Suspense>
    </main>
  );
}
