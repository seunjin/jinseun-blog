# 개인 블로그 프로젝트 (개정안: Next.js + Supabase + Vercel)

## 목표 요약

- **FE/BE/운영** 역량을 한 번에: Next.js(App Router, RSC/Server
  Actions) + Supabase(Auth/DB/Storage/Edge) + Vercel(CI/CD & Edge).
- **학습 우선**: RLS, Server Actions, Edge 캐시/ISR, MDX 파이프라인,
  OAuth, 관리 화면까지.

---

## 기술 스택 (업데이트)

1.  **Frontend**: Next.js 최신(App Router, RSC, Server Actions, Route
    Handlers)\
2.  **Backend 대체**: Supabase(인증/Auth, DB(Postgres), Storage, Edge
    Functions)\
3.  **Database**: Supabase Postgres (+ Prisma 사용 가능. 초기엔 **Prisma
    없이 SQL + Drizzle 또는 Supabase SQL**로 시작 추천)\
4.  **Shared**: Zod 스키마(입출력 밸리데이션, Server Actions와 공유)\
5.  **Infra**: Vercel(프론트/라우트 핸들러/Edge), Supabase(관리형
    백엔드)\
6.  **UI/CSS**: 접근성 우선 → 이후 Figma로 보완\
7.  **Optional**: Drizzle ORM(마이그레이션 & 타입 편의),
    Contentlayer(MDX 파일 기반 선택 시)

---

## 배포 아이디어 (업데이트)

- **Front(=전체 앱)**: Vercel (Next.js App)
  - ISR/Route Segment Config로 정적화 전략 → 리스트/상세 캐시 조합\
  - Server Actions/Route Handlers로 DB 액세스 (서버 전용)\
- **Back**: 별도 서버 없음 (Supabase 사용)
  - **Supabase Edge Functions**(필요 시): Webhook 처리, Cron, 비동기
    작업\
- **DB**: Supabase(Postgres)
  - 마이그레이션: 초기엔 SQL 파일 → 필요 시 Drizzle 또는 Prisma
    도입\
- **비밀/환경 변수**:
  - **Vercel**: NEXT_PUBLIC\_\*, SUPABASE_URL, SUPABASE_ANON_KEY\
  - **Vercel 프로젝트 환경**에 Git 브랜치별(Preview/Prod) 분리\
  - **RLS**로 보안 강화 (클라이언트 쿼리 노출 가능하므로 정책 중요)

---

## 기능 우선순위 (Must/Should/Could) --- 그대로 유지하되 구현 방식만 Supabase 기준으로

### Public

- **Must**
  - 리스트/상세 기본 구조
  - 단일 계층 카테고리 + Tag 조합 분류
  - 검색/필터(간단 텍스트 검색 → Postgres `tsvector` 혹은
    `ILIKE`부터)
  - 상세 TOC: `rehype-slug` + `IntersectionObserver` 기반 scrollspy
  - 이전/다음 글/추천 글
- **Should**
  - 리스트/카드 토글, 리스트=페이지네이션 / 카드=무한스크롤
- **Could**
  - 댓글: **Giscus** 우선(간편). 자체 댓글은 RLS/모더레이션 등 고려
    후

### Admin

- **Must**
  - **Google OAuth(Supabase Auth)** + 허용 이메일
    화이트리스트(RLS/정책)\
  - 글 CRUD(초안/공개/비공개), 카테고리/태그/작성일 관리\
  - **MDX 기반 에디팅**: 저장 전략(파일 vs DB) 확정 필요
- **Should**
  - 실시간 미리보기(BroadcastChannel or Supabase Realtime + Draft)
  - 간단 통계 대시보드(페이지뷰 집계: 임시로 Supabase table or
    Tinybird/Umami 연동)
- **Could**
  - 미디어 관리: Supabase Storage(버킷 정책 + URL 복사 UX)

---

## **데이터 모델 제안 (초안 / SQL)**

```sql
-- users: Supabase auth.users를 사용. 공개 프로필 별도 테이블 권장.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text,
  role text default 'user',
  created_at timestamptz default now()
);

create table public.categories (
  id serial primary key,
  name text unique not null,
  slug text unique not null
);

create table public.tags (
  id serial primary key,
  name text unique not null,
  slug text unique not null
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  summary text,
  content_mdx text,
  cover_url text,
  category_id int references public.categories(id) on delete set null,
  status text not null default 'draft',
  published_at timestamptz,
  author_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.post_tags (
  post_id uuid references public.posts(id) on delete cascade,
  tag_id int references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create table public.post_views (
  post_id uuid references public.posts(id) on delete cascade,
  yyyymmdd int not null,
  count int not null default 0,
  primary key (post_id, yyyymmdd)
);
```

---

## **폴더 구조 (Next.js App Router)**

    apps/blog/
    ├─ app/
    │  ├─ (public)/
    │  │  ├─ page.tsx
    │  │  ├─ posts/[slug]/page.tsx
    │  │  ├─ tags/[slug]/page.tsx
    │  │  ├─ categories/[slug]/page.tsx
    │  │  └─ sitemap.ts
    │  ├─ admin/
    │  │  ├─ layout.tsx
    │  │  ├─ page.tsx
    │  │  ├─ posts/new/page.tsx
    │  │  ├─ posts/[id]/edit/page.tsx
    │  │  └─ api/
    │  ├─ api/
    │  │  └─ track-view/route.ts
    │  ├─ actions/
    │  │  ├─ posts.ts
    │  │  └─ auth.ts
    │  ├─ lib/
    │  │  ├─ supabase/client.ts
    │  │  ├─ supabase/server.ts
    │  │  ├─ mdx.ts
    │  │  └─ zod-schemas.ts
    │  └─ styles/
    ├─ scripts/
    ├─ docs/
    │  ├─ architecture.md
    │  ├─ ops-playbook.md
    │  └─ project-overview.md
    └─ .env.local

---

## **환경 변수 (.env)**

    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...

---

## **초기 셋업 절차 (Step-by-step)**

1.  Supabase 프로젝트 생성 → URL/Anon 키 확보\

2.  SQL 실행: 위 테이블/인덱스/RLS 정책 생성\

3.  Vercel 프로젝트 생성 → Git 연동 → 환경 변수 등록\

4.  Next.js 프로젝트 시작

    ```bash
    pnpm dlx create-next-app@latest blog --ts --eslint
    cd blog
    pnpm add @supabase/supabase-js remark rehype rehype-slug zod
    ```

5.  supabase 클라이언트 헬퍼 추가 (client.ts/server.ts)\

6.  auth 구성 → Google Provider 활성화(Supabase 대시보드)\

7.  Admin 라우팅 보호(layout.tsx에서 세션 검사)\

8.  글 작성 → Server Action → revalidatePath\

9.  TOC/Scrollspy 구현\

10. Vercel 배포

---

## **Phase 로드맵**

### Phase 1 (Must)

- Auth(Google) + Admin 보호 라우팅
- Posts CRUD(DB 기반 MDX)
- 리스트/상세/카테고리/태그/검색 기본
- TOC/Scrollspy
- Vercel + Supabase 배포

### Phase 2 (Must+)

- 페이지네이션/무한스크롤
- 추천/이전·다음 글
- Storage 업로드
- 기본 통계

### Phase 3 (Should)

- Giscus 댓글
- 실시간 미리보기
- 고도화된 검색

### Phase 4 (Could)

- Edge Functions
- 자체 댓글
- 일부 문서 파일 기반 전환

---
