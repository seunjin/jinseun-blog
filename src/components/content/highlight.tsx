import type { ReactNode } from "react";
import { css } from "@/styled-system/css";

export type HighlightProps = {
  children: ReactNode;
};

const highlightClass = css({
  marginTop: "6",
  padding: "5",
  borderRadius: "lg",
  background: "gray.900",
  color: "gray.50",
  position: "relative",
  overflow: "hidden",
  _before: {
    content: '""',
    position: "absolute",
    inset: "0",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.08), transparent 60%)",
    pointerEvents: "none",
  },
});

export function Highlight({ children }: HighlightProps) {
  return <div className={highlightClass}>{children}</div>;
}
