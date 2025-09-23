import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import { Callout } from "@/components/content/callout";
import { Figure } from "@/components/content/figure";
import { Highlight } from "@/components/content/highlight";
import { css } from "@/styled-system/css";

const styles = {
  h1: css({
    fontSize: { base: "3xl", md: "4xl" },
    fontWeight: "semibold",
    marginTop: "10",
  }),
  h2: css({
    fontSize: { base: "2xl", md: "3xl" },
    fontWeight: "semibold",
    marginTop: "10",
  }),
  h3: css({
    fontSize: { base: "xl", md: "2xl" },
    fontWeight: "semibold",
    marginTop: "8",
  }),
  p: css({ marginTop: "4", lineHeight: "tall" }),
  ul: css({ marginTop: "4", paddingLeft: "6" }),
  ol: css({ marginTop: "4", paddingLeft: "6" }),
  li: css({ marginTop: "2" }),
  blockquote: css({
    marginTop: "6",
    borderLeftWidth: "4px",
    borderColor: "gray.300",
    paddingLeft: "6",
    fontStyle: "italic",
    color: "gray.600",
    _dark: { borderColor: "gray.600", color: "gray.300" },
  }),
  img: css({ marginTop: "6", marginBottom: "6", borderRadius: "xl" }),
  code: css({
    paddingInline: "2",
    paddingBlock: "1",
    borderRadius: "md",
    backgroundColor: "gray.100",
    fontSize: "sm",
    _dark: { backgroundColor: "gray.800" },
  }),
  pre: css({
    marginTop: "6",
    padding: "6",
    borderRadius: "xl",
    backgroundColor: "gray.950",
    color: "gray.100",
    overflowX: "auto",
  }),
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className={styles.h1} {...props} />,
    h2: (props) => <h2 className={styles.h2} {...props} />,
    h3: (props) => <h3 className={styles.h3} {...props} />,
    p: (props) => <p className={styles.p} {...props} />,
    ul: (props) => <ul className={styles.ul} {...props} />,
    ol: (props) => <ol className={styles.ol} {...props} />,
    li: (props) => <li className={styles.li} {...props} />,
    blockquote: (props) => (
      <blockquote className={styles.blockquote} {...props} />
    ),
    img: (props) => (
      <Image
        className={styles.img}
        alt={props.alt ?? ""}
        width={props.width ? Number(props.width) : 1200}
        height={props.height ? Number(props.height) : 675}
        {...props}
      />
    ),
    code: (props) => <code className={styles.code} {...props} />,
    pre: (props) => <pre className={styles.pre} {...props} />,
    Callout,
    Figure,
    Highlight,
    ...components,
  };
}
