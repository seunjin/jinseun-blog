import { notFound, redirect } from "next/navigation";
// 또는 import { notFound } from "next/navigation";

export default function AdminCatchAll() {
  //   redirect("/admin");
  // 또는
  notFound(); // 이 경우 app/(admin)/admin/not-found.tsx가 실행됩니다.
}
