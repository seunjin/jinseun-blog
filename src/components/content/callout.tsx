import type { ReactNode } from "react";
import { css } from "@/styled-system/css";
import { hstack } from "@/styled-system/patterns";

const container = css({
  marginTop: "6",
  borderRadius: "xl",
  padding: "5",
  borderWidth: "1px",
  borderColor: "gray.200",
  background: "gray.50",
  color: "gray.800",
  _dark: { borderColor: "gray.700", background: "gray.900", color: "gray.100" },
});

const variants: Record<CalloutProps["type"], { icon: string; accent: string }> =
  {
    info: { icon: "💡", accent: "blue.500" },
    tip: { icon: "✨", accent: "green.500" },
    warn: { icon: "⚠️", accent: "yellow.500" },
    danger: { icon: "🚨", accent: "red.500" },
  };

const iconClass = (accent: string) =>
  css({
    fontSize: "xl",
    color: accent,
  });

const bodyClass = css({
  lineHeight: "tall",
});

export type CalloutProps = {
  children: ReactNode;
  type?: "info" | "tip" | "warn" | "danger";
  title?: ReactNode;
};

export function Callout({ children, type = "info", title }: CalloutProps) {
  const { icon, accent } = variants[type];

  return (
    <aside className={container}>
      <div className={hstack({ gap: "3", align: "flex-start" })}>
        <span className={iconClass(accent)}>{icon}</span>
        <div className={bodyClass}>
          {title ? (
            <p className={css({ fontWeight: "medium", marginBottom: "2" })}>
              {title}
            </p>
          ) : null}
          <div>{children}</div>
        </div>
      </div>
    </aside>
  );
}
