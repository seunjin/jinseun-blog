import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server-client";
import Link from "next/link";
import { CSSProperties } from "react";
import { LogoutButton } from "./logout-button";
const StyledHeader: CSSProperties = {
  position: "sticky",
  top: "0",
  height: "56px",
  backgroundColor: "white",
  borderBottom: "1px solid #eee",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  padding: "0 16px",
  zIndex: 100,
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // 로그인 페이지로 리다이렉트하거나 커스텀 로그인 컴포넌트 렌더
    redirect("/auth/login"); // 또는 <LoginScreen />을 반환
  }
  return (
    <>
      <header style={StyledHeader}>
        <Link href="/admin">관리자 페이지 로고</Link>
        <LogoutButton />
      </header>
      <main>{children}</main>
    </>
  );
}
