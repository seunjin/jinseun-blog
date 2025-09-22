# 프로젝트 아키텍처 개요

## 디렉터리 구조
```
src/
  app/                # Next.js App Router 엔트리, 라우트/레이아웃/서버 액션
  components/
    ui/               # 재사용 가능한 UI 프리미티브
    form/             # 폼·입력 관련 컴포넌트
    layout/           # 레이아웃/레이아웃 헬퍼
  features/           # 도메인별 모듈 (예: posts, auth 등)
  hooks/              # 전역에서 공유 가능한 커스텀 훅
  lib/                # Supabase 클라이언트, 헬퍼, 공용 유틸
  styles/             # Panda 테마, 디자인 토큰, 글로벌 스타일 확장
```

> 도메인별 훅은 `src/features/<domain>/hooks/`에 배치하고, 공용 훅만 `src/hooks/`에 둡니다.

## 경로 별칭
- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@features/*` → `src/features/*`
- `@hooks/*` → `src/hooks/*`
- `@lib/*` → `src/lib/*`
- `@styles/*` → `src/styles/*`

Vitest 설정(`vitest.config.ts`)과 TypeScript(`tsconfig.json`) 모두 동일한 별칭을 공유합니다.

## 폴더 운영 원칙
- `components/`는 도메인에 의존하지 않는 요소만 위치시키고, 특화된 UI는 각 feature 내부에 둡니다.
- 테스트 파일은 가능하면 대상 파일과 같은 경로에 `*.test.tsx` 형태로 배치합니다.
- 새로운 feature를 추가하면 `features/<feature-name>/` 안에 `components/`, `hooks/`, `services/`, `types/` 등의 하위 폴더를 만들어 확장합니다.
- 구조 변경이나 원칙 수정이 필요하면 이 문서와 `docs/collaboration-guidelines.md`를 함께 업데이트합니다.
