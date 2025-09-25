import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { css } from "@/styled-system/css";

const layoutClass = css({
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "240px 1fr" },
});

const sidebarClass = css({
  padding: { base: "4", md: "6" },
  borderRightWidth: { base: "0", md: "1px" },
  borderColor: "gray.200",
  _dark: { borderColor: "gray.800" },
  display: "flex",
  flexDirection: { base: "row", md: "column" },
  gap: "4",
  justifyContent: { base: "space-between", md: "flex-start" },
  alignItems: { base: "center", md: "flex-start" },
});

const contentClass = css({
  padding: { base: "4", md: "8" },
});

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 서버 사이드 가드: 세션/허용 이메일 확인
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 세션이 없는 경우, 미들웨어에서 이미 redirect 파라미터를 붙여 /signin으로 보냅니다.
  // 여기서는 추가 리다이렉트를 하지 않아 원래 경로 정보가 보존되도록 합니다.

  const allowList = (process.env.ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowList.length > 0 && session) {
    const email = session.user.email?.toLowerCase();
    if (!email || !allowList.includes(email))
      redirect("/signin?reason=forbidden");
  }

  return (
    <div className={layoutClass}>
      <aside className={sidebarClass}>
        <div className={css({ fontWeight: "semibold" })}>Admin</div>
        <nav
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "3",
          })}
        >
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/content">Content</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/admin/settings">Settings</Link>
          <Link
            href="/auth/signout"
            className={css({
              marginTop: { base: "0", md: "auto" },
              paddingInline: "3",
              paddingBlock: "2",
              borderRadius: "md",
              background: "black",
              color: "white",
              textAlign: "center",
              _dark: { background: "white", color: "black" },
            })}
          >
            로그아웃
          </Link>
        </nav>
      </aside>
      <div className={contentClass}>{children}</div>
    </div>
  );
}
