import Link from "next/link";
import type { ReactNode } from "react";
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

export default function AdminLayout({ children }: { children: ReactNode }) {
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
