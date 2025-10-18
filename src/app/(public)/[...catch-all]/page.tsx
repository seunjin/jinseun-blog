import NotFound from "@/app/(public)/not-found";

export default function PublicCatchAll() {
  //   redirect("/admin");
  // 또는
  NotFound(); // 이 경우 app/(admin)/admin/not-found.tsx가 실행됩니다.
}
