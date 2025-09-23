import Link from "next/link";
import type { ReactNode } from "react";
import { css } from "@/styled-system/css";
import { hstack } from "@/styled-system/patterns";

const shellClass = css({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
});

const headerClass = hstack({
  justify: "space-between",
  alignItems: "center",
  paddingInline: { base: "4", md: "8" },
  paddingBlock: "4",
  borderBottomWidth: "1px",
  borderColor: "gray.200",
  _dark: { borderColor: "gray.800" },
});

const navClass = hstack({
  gap: "4",
});

const mainClass = css({
  flex: "1 1 auto",
});

const footerClass = css({
  paddingInline: { base: "4", md: "8" },
  paddingBlock: "6",
  borderTopWidth: "1px",
  borderColor: "gray.200",
  fontSize: "sm",
  color: "gray.500",
  _dark: { borderColor: "gray.800", color: "gray.400" },
});

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={shellClass}>
      <header className={headerClass}>
        <Link
          href="/"
          className={css({ fontWeight: "semibold", fontSize: "lg" })}
        >
          jinseun
        </Link>
        <nav className={navClass}>
          <Link href="/archive">Archive</Link>
          <Link href="/about">About</Link>
        </nav>
      </header>
      <main className={mainClass}>{children}</main>
      <footer className={footerClass}>
        © {new Date().getFullYear()} Jin Seun. All rights reserved.
      </footer>
    </div>
  );
}
