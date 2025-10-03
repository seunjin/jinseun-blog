import Link from "next/link";

export default function PublicNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">페이지를 찾을 수 없습니다.</h1>
      <p className="text-sm text-gray-500">
        방문하시려는 페이지가 삭제되었거나 주소가 잘못된 것 같아요.
      </p>
      <Link
        href="/"
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
