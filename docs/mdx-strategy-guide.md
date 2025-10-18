# MDX 콘텐츠 전략 가이드

Next.js(App Router) + Supabase 기반 블로그에서 MDX를 DB에 저장하고 렌더링하기 위한 절차를 정리합니다. 모든 설명은 프로젝트 공통 규칙(한글 커뮤니케이션, 한글 주석/JSDoc) 기준을 따릅니다.

## 선행 작업 우선순위
- **1. 데이터 스키마 확정**: Supabase Postgres 테이블 구조, RLS 정책, 인덱스를 우선 정의합니다. `posts`, `categories`, `tags`, `post_tags`, `profiles` 등 핵심 테이블에 MDX 저장 필드와 검색/정렬에 필요한 컬럼을 명확히 합니다.
- **2. 콘텐츠 저장/조회 플로우 설계**: Admin 에디터 → Server Action → Supabase 저장 → Public 뷰 렌더의 전체 흐름을 시퀀스 다이어그램으로 그려두고, 필요한 Server Action/Route Handler API를 명세합니다.
- **3. MDX 파이프라인 확립**: remark/rehype 플러그인 구성, 런타임 컴파일 유틸, 보안 기준을 정리한 후 구현을 시작합니다.
- **4. 캐싱 및 배포 전략 설정**: Route Segment Config(ISR), `revalidatePath`, React Query prefetch 패턴을 언제 사용할지 결정합니다.

## Supabase 스키마 권장 구조
- `posts` 테이블
  - `title`, `slug`, `summary`, `status`, `category_id`, `published_at`, `author_id`는 기본 필드로 유지합니다.
  - MDX 관련 필드
    - `content_mdx`(`text`): 에디터 원본.
    - `content_compiled`(`text`): `@mdx-js/mdx` 컴파일 결과(React 컴포넌트 문자열 또는 JSX 코드).
    - `content_html`(`text`): 검색/미리보기용 HTML. SSR 시 바로 사용하거나 fallback으로 활용합니다.
    - `content_plain`(`text`): 검색용 텍스트 버전(Strip된 Markdown/HTML). Postgres `tsvector` 생성 시 기초 데이터로 사용합니다.
    - `toc_json`(`jsonb`): TOC를 미리 계산해 저장하면 상세 페이지에서 즉시 사용 가능합니다.
  - 변경 추적이 필요하면 `post_revisions` 보조 테이블을 도입해 과거 MDX를 기록합니다.
- 인덱스 및 RLS
  - `slug`, `status`, `published_at`에 인덱스를 추가해 리스트/상세 조회를 빠르게 합니다.
  - RLS는 Admin 계정은 전체 액세스, Public은 `status = 'published'`인 글만 조회하도록 정책을 작성합니다.

## Admin 작성 플로우
1. Admin UI에서 MDX 작성 → 저장 버튼을 누르면 Server Action 호출.
2. Server Action 단계
   - Supabase 세션 검증 후 입력값을 Zod 스키마로 유효성 검사합니다.
   - `content_mdx`를 그대로 저장하기 전에 MDX 컴파일러 유틸을 호출해 `content_compiled`, `content_html`, `toc_json`, `content_plain`을 생성합니다.
   - Supabase `posts` 테이블에 트랜잭션으로 upsert하고, 필요 시 `post_tags`를 동기화합니다.
   - 발행 상태(`status === 'published'`)일 경우 `revalidatePath("/posts/[slug]")`, 리스트 페이지 등 관련 경로를 재검증합니다.
3. 저장 성공 후에는 React Query 캐시를 무효화하거나 Server Component에서 `redirect`/`refresh`로 최신 데이터를 반영합니다.

## MDX 컴파일 파이프라인
- 서버 전용 유틸(`app/lib/mdx.ts` 등)을 만들어 `compileMdx({ source, scope })` 함수를 제공합니다.
- 플러그인 구성 예시
  - `remark-gfm`, `remark-frontmatter`, `remark-smartypants`
  - `rehype-slug`, `rehype-autolink-headings`, `rehype-prism-plus`
  - 필요 시 `rehype-sanitize`를 통해 허용 태그/속성을 명시적으로 제한합니다.
- 컴파일 시 `gray-matter`로 frontmatter를 분리하고, frontmatter는 Zod로 검증 후 `posts` 테이블 메타필드에 매핑합니다.
- 런타임에는 `next-mdx-remote/rsc` 혹은 `@mdx-js/mdx`의 `run`을 활용해 React 컴포넌트로 평가하고, `useMDXComponents`로 커스텀 요소를 주입합니다.

## 퍼블릭 렌더링 전략(App Router)
- 상세 페이지는 서버 컴포넌트에서 Supabase를 호출해 게시글 데이터를 가져옵니다.
- React Query prefetch 패턴을 사용해 `HydrationBoundary`로 클라이언트 캐시를 채웁니다.
- `content_compiled`을 `eval`하지 않고, 안전한 방식으로 `MDXRemote` 등에 전달합니다. (`content_html`은 fallback 또는 skeleton 렌더링에 활용)
- `toc_json`을 이용해 `rehype-slug`로 생성한 id와 매칭되는 Scrollspy를 구성합니다.

## 캐싱 및 배포 전략
- 퍼블릭 라우트는 `revalidate = 0`(완전 SSR) 또는 ISR(`revalidate = 60`) 중 선택해 성능과 최신성 균형을 맞춥니다.
- Admin 저장 후 `revalidatePath`/`revalidateTag`로 필요한 페이지를 갱신합니다.
- Supabase Edge Function을 사용해 정기적으로 `post_views` 같은 부가 데이터를 집계할 수 있습니다.
- 로컬 개발 환경에서는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 `.env.local`에 세팅하고, 서버 전용 키는 Server Action에서만 사용합니다.

## 구현 체크리스트
- [ ] Supabase 스키마/인덱스/RLS 정의 및 SQL 스크립트 준비
- [ ] MDX 컴파일러 유틸 초안 구현 및 단위 테스트
- [ ] Server Action 저장 플로우 + Admin UI 연결
- [ ] 퍼블릭 페이지 캐싱 전략 및 React Query 프리패치 적용
- [ ] 배포 환경 변수 정리(Vercel, Supabase) 및 문서화
