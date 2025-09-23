import { CATEGORY_LABELS, findPostBySlug, posts } from "@content/posts";
import Image from "next/image";
import { notFound } from "next/navigation";
import { css } from "@/styled-system/css";
import { hstack, stack } from "@/styled-system/patterns";

interface ArchiveDetailPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.metadata.slug }));
}

export function generateMetadata({ params }: ArchiveDetailPageProps) {
  const { slug } = params;
  const post = findPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.metadata.title} | Archive`,
    description: post.metadata.summary,
  };
}

export default function ArchiveDetailPage({ params }: ArchiveDetailPageProps) {
  const { slug } = params;
  const post = findPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { metadata, Content } = post;

  return (
    <article
      className={css({
        maxWidth: "680px",
        margin: "0 auto",
        paddingBlock: { base: "10", md: "16" },
        paddingInline: { base: "6", md: "8" },
        display: "flex",
        flexDirection: "column",
        gap: "8",
      })}
    >
      <header className={stack({ gap: "4" })}>
        <div className={hstack({ gap: "3", wrap: "wrap" })}>
          <span
            className={css({
              fontSize: "xs",
              fontWeight: "medium",
              textTransform: "uppercase",
              letterSpacing: "widest",
              color: "gray.500",
              _dark: { color: "gray.400" },
            })}
          >
            {CATEGORY_LABELS[metadata.category]}
          </span>
          <span className={css({ fontSize: "xs", color: "gray.400" })}>
            {new Date(metadata.date).toLocaleDateString("ko-KR")}
          </span>
        </div>
        <div className={stack({ gap: "3" })}>
          <h1
            className={css({
              fontSize: { base: "3xl", md: "4xl" },
              fontWeight: "semibold",
            })}
          >
            {metadata.title}
          </h1>
          <p
            className={css({
              color: "gray.600",
              _dark: { color: "gray.300" },
              lineHeight: "tall",
            })}
          >
            {metadata.summary}
          </p>
        </div>
        <div className={hstack({ gap: "2", wrap: "wrap" })}>
          {metadata.tags.map((tag) => (
            <span
              key={tag}
              className={css({
                fontSize: "xs",
                paddingInline: "2.5",
                paddingBlock: "1",
                borderRadius: "md",
                background: "gray.100",
                color: "gray.700",
                _dark: { background: "gray.800", color: "gray.200" },
              })}
            >
              #{tag}
            </span>
          ))}
        </div>
        {metadata.heroImage ? (
          <div className={css({ marginTop: "4" })}>
            <Image
              src={metadata.heroImage}
              alt={metadata.title}
              width={1200}
              height={630}
              className={css({ borderRadius: "xl" })}
            />
          </div>
        ) : null}
      </header>
      <div className={css({ color: "gray.800", _dark: { color: "gray.100" } })}>
        <Content />
      </div>
    </article>
  );
}
