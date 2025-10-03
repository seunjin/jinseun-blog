import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">잘못된 관리자 페이지입니다.</h1>
      <p className="text-sm text-gray-500">
        요청하신 주소를 찾을 수 없습니다. 관리자 홈으로 이동해 다시 시도해주세요.
      </p>
      <Link
        href="/admin"
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
      >
        관리자 홈으로 이동
      </Link>
    </div>
  );
}
