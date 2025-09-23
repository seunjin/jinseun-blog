import { css } from "@/styled-system/css";
import { stack } from "@/styled-system/patterns";

const containerClass = css({
  maxWidth: "3xl",
  margin: "0 auto",
  paddingBlock: { base: "10", md: "16" },
  paddingInline: { base: "6", md: "8" },
});

export default function AboutPage() {
  return (
    <section className={containerClass}>
      <div
        className={stack({
          gap: "6",
        })}
      >
        <header>
          <h1
            className={css({
              fontSize: { base: "3xl", md: "4xl" },
              fontWeight: "semibold",
            })}
          >
            About
          </h1>
          <p
            className={css({
              color: "gray.600",
              _dark: { color: "gray.300" },
              marginTop: "2",
            })}
          >
            Jin Seun의 개인 블로그 겸 포트폴리오 아카이브입니다. 학습과 실험을
            기록하고, 협업 기회를 열어두기 위한 공간이에요.
          </p>
        </header>
        <div>
          <h2
            className={css({
              fontSize: "xl",
              fontWeight: "medium",
              marginBottom: "3",
            })}
          >
            현재 집중 분야
          </h2>
          <ul className={stack({ gap: "2" })}>
            <li
              className={css({
                color: "gray.700",
                _dark: { color: "gray.300" },
              })}
            >
              Next.js App Router 기반 풀스택 서비스 구축
            </li>
            <li
              className={css({
                color: "gray.700",
                _dark: { color: "gray.300" },
              })}
            >
              Supabase & Panda CSS를 활용한 DX 실험
            </li>
            <li
              className={css({
                color: "gray.700",
                _dark: { color: "gray.300" },
              })}
            >
              콘텐츠 제작, 문서화, 학습 공유
            </li>
          </ul>
        </div>
        <div>
          <h2
            className={css({
              fontSize: "xl",
              fontWeight: "medium",
              marginBottom: "3",
            })}
          >
            연락 및 링크
          </h2>
          <ul className={stack({ gap: "2" })}>
            <li>
              <a
                className={css({ textDecoration: "underline" })}
                href="mailto:jin@example.com"
              >
                Email
              </a>
            </li>
            <li>
              <a
                className={css({ textDecoration: "underline" })}
                href="https://github.com/seunjin"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                className={css({ textDecoration: "underline" })}
                href="https://resume.url"
                target="_blank"
                rel="noreferrer"
              >
                Resume
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
