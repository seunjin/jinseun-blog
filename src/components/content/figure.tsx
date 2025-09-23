import Image from "next/image";
import type { ReactNode } from "react";
import { css } from "@/styled-system/css";
import { stack } from "@/styled-system/patterns";

export type FigureProps = {
  src: string;
  alt: string;
  caption?: ReactNode;
  width?: number;
  height?: number;
};

const wrapper = stack({ gap: "2", marginTop: "6", align: "center" });
const imageClass = css({ borderRadius: "xl", overflow: "hidden" });
const captionClass = css({
  fontSize: "sm",
  color: "gray.500",
  _dark: { color: "gray.400" },
  textAlign: "center",
});

export function Figure({
  src,
  alt,
  caption,
  width = 1200,
  height = 675,
}: FigureProps) {
  return (
    <figure className={wrapper}>
      <div className={imageClass}>
        <Image src={src} alt={alt} width={width} height={height} />
      </div>
      {caption ? (
        <figcaption className={captionClass}>{caption}</figcaption>
      ) : null}
    </figure>
  );
}
