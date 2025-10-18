import Link from "next/link";
import type { CSSProperties } from "react";

const RootDiv: CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  minHeight: "100vh",
};

const StyledHeader: CSSProperties = {
  position: "sticky",
  top: "0",
  height: "56px",
  backgroundColor: "white",
  borderBottom: "1px solid #eee",
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "0 16px",
  zIndex: 100,
};

const StyledFooter: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  height: "120px",
  backgroundColor: "rgb(250, 250, 250)",
  borderTop: "1px solid #eee",
  padding: "0 16px",
  zIndex: 100,
};

const StyledLink: CSSProperties = {
  fontWeight: "bold",
  fontSize: 24,
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={RootDiv}>
      <header style={StyledHeader}>
        <Link href={"/"} style={StyledLink}>
          홈
        </Link>
        <Link href={"/admin"} style={StyledLink}>
          관리자
        </Link>
      </header>
      <main>{children}</main>
      <footer style={StyledFooter}>@copyright jinseun</footer>
    </div>
  );
}
