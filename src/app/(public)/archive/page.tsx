import { css } from "@/styled-system/css";

const containerClass = css({
  maxWidth: "4xl",
  margin: "0 auto",
  paddingBlock: { base: "10", md: "16" },
  paddingInline: { base: "6", md: "8" },
  display: "flex",
  flexDirection: "column",
  gap: "6",
});

export default function ArchivePage() {
  return (
    <section className={containerClass}>
      <header>
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
          태그 필터가 추가될 예정입니다.
        </p>
      </header>
      <div
        className={css({
          padding: "8",
          borderWidth: "1px",
          borderStyle: "dashed",
          borderColor: "gray.300",
          borderRadius: "lg",
          color: "gray.500",
          _dark: { borderColor: "gray.700", color: "gray.400" },
        })}
      >
        콘텐츠 카드와 필터 UI가 이 영역에 배치됩니다.
      </div>
    </section>
  );
}
