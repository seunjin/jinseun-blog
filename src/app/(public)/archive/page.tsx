import { CATEGORY_LABELS, type PostCategory, posts } from "@content/posts";
import Link from "next/link";
import { css } from "@/styled-system/css";
import { hstack, stack } from "@/styled-system/patterns";

const containerClass = css({
  maxWidth: "5xl",
  margin: "0 auto",
  paddingBlock: { base: "10", md: "16" },
  paddingInline: { base: "6", md: "8" },
  display: "flex",
  flexDirection: "column",
  gap: "8",
});

const categories = Object.keys(CATEGORY_LABELS) as PostCategory[];

export default function ArchivePage() {
  return (
    <section className={containerClass}>
      <header className={stack({ gap: "3" })}>
        <div>
          <h1
            className={css({
              fontSize: { base: "3xl", md: "4xl" },
              fontWeight: "semibold",
            })}
          >
            Archive
          </h1>
          <p
            className={css({
              color: "gray.600",
              _dark: { color: "gray.300" },
              marginTop: "2",
            })}
          >
            모든 콘텐츠를 한 곳에서 탐색할 수 있는 통합 피드입니다. 카테고리와
            태그 필터는 곧 추가될 예정이에요.
          </p>
        </div>
        <div className={hstack({ gap: "3", wrap: "wrap" })}>
          {categories.map((category) => (
            <span
              key={category}
              className={css({
                display: "inline-flex",
                alignItems: "center",
                paddingInline: "3",
                paddingBlock: "1.5",
                borderRadius: "full",
                fontSize: "sm",
                fontWeight: "medium",
                background: "gray.900",
                color: "gray.50",
                opacity:
                  category === "resources" || category === "timeline"
                    ? 0.35
                    : 1,
              })}
            >
              {CATEGORY_LABELS[category]}
            </span>
          ))}
        </div>
      </header>

      <div className={stack({ gap: "6" })}>
        {posts.map((post) => (
          <article
            key={post.metadata.slug}
            className={css({
              borderWidth: "1px",
              borderColor: "gray.200",
              borderRadius: "xl",
              padding: { base: "5", md: "6" },
              transitionProperty: "common",
              transitionDuration: "normal",
              _hover: {
                borderColor: "gray.400",
                transform: "translateY(-2px)",
              },
              _dark: {
                borderColor: "gray.700",
                _hover: { borderColor: "gray.500" },
              },
            })}
          >
            <div className={stack({ gap: "3" })}>
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
                  {CATEGORY_LABELS[post.metadata.category]}
                </span>
                <span className={css({ fontSize: "xs", color: "gray.400" })}>
                  {new Date(post.metadata.date).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <div className={stack({ gap: "2" })}>
                <h2
                  className={css({
                    fontSize: { base: "2xl", md: "3xl" },
                    fontWeight: "semibold",
                  })}
                >
                  <Link
                    href={`/archive/${post.metadata.slug}`}
                    className={css({ _hover: { textDecoration: "underline" } })}
                  >
                    {post.metadata.title}
                  </Link>
                </h2>
                <p
                  className={css({
                    color: "gray.600",
                    _dark: { color: "gray.300" },
                    lineHeight: "tall",
                  })}
                >
                  {post.metadata.summary}
                </p>
              </div>
              <div className={hstack({ gap: "2", wrap: "wrap" })}>
                {post.metadata.tags.map((tag) => (
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
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
