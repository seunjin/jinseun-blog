import Link from "next/link";
import { css } from "@/styled-system/css";
import { hstack, stack } from "@/styled-system/patterns";

const pageClass = css({
  minHeight: "100svh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingBlock: { base: "16", md: "24" },
  paddingInline: { base: "6", md: "10" },
});

const kickerClass = css({
  textTransform: "uppercase",
  letterSpacing: "widest",
  fontSize: "xs",
  fontWeight: "medium",
  color: "gray.500",
  _dark: { color: "gray.400" },
});

const titleClass = css({
  fontSize: { base: "3xl", md: "5xl" },
  fontWeight: "semibold",
  lineHeight: "tight",
});

const descriptionClass = css({
  fontSize: { base: "md", md: "lg" },
  color: "gray.600",
  _dark: { color: "gray.300" },
  maxWidth: "2xl",
});

const primaryButtonClass = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  paddingInline: "6",
  paddingBlock: "3",
  borderRadius: "full",
  fontWeight: "medium",
  background: "black",
  color: "white",
  transitionProperty: "common",
  transitionDuration: "normal",
  _hover: {
    background: "gray.800",
  },
  _dark: {
    background: "white",
    color: "black",
    _hover: { background: "gray.200" },
  },
});

const secondaryButtonClass = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  paddingInline: "6",
  paddingBlock: "3",
  borderRadius: "full",
  fontWeight: "medium",
  borderWidth: "1px",
  borderColor: "gray.300",
  color: "gray.950",
  _dark: {
    borderColor: "gray.600",
    color: "gray.200",
  },
  transitionProperty: "common",
  transitionDuration: "normal",
  _hover: {
    borderColor: "gray.400",
    _dark: { borderColor: "gray.400" },
  },
});

export default function Home() {
  return (
    <section className={pageClass}>
      <div
        className={stack({ gap: "6", align: "center", textAlign: "center" })}
      >
        <span className={kickerClass}>In progress</span>
        <h1 className={titleClass}>jinseun blog</h1>
        <p className={descriptionClass}>
          A digital garden for experiments, study notes, and reflections while
          building in public with Next.js and Panda CSS.
        </p>
        <div
          className={hstack({
            gap: "4",
            justify: "center",
            flexWrap: "wrap",
          })}
        >
          <Link className={primaryButtonClass} href="#latest">
            Read latest updates
          </Link>
          <Link className={secondaryButtonClass} href="#roadmap">
            View roadmap
          </Link>
        </div>
      </div>
    </section>
  );
}
