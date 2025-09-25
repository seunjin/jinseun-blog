import { redirect } from "next/navigation";

// 존재하지 않는 /admin 하위 경로는 /admin으로 리다이렉트
export default function AdminCatchAll() {
  redirect("/admin");
}
