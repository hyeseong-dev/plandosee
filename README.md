# PlanDoSee

> 계획하고(Plan), 실행하고(Do), 돌아본 내용(See)을 다음 계획으로 이어가는 기록형 플래너

[운영 서비스](https://plandosee-chi.vercel.app) · [프로젝트 계획](docs/PROJECT_PLAN.md) · [최종 검증 기록](docs/SUBMISSION.md)

PlanDoSee는 할 일을 단순히 완료하는 데서 끝나지 않습니다. 계획한 시간과 실제 사용한 시간을 같은 자리에서 비교하고, 숫자의 근거가 된 기록을 확인하며, 돌아보기에서 얻은 개선점 한 가지를 다음 계획으로 전달합니다.

단체 공통 과제에서 흔히 나오는 획일적인 결과물을 피하기 위해 밝은 **작은 정원**을 시각 콘셉트로 삼았습니다. Wanted Sans, 부드러운 곡률, 옅은 민트·살구색과 절제된 그림자를 사용해 모던하고 귀엽지만 정보는 선명하게 읽히도록 구성했습니다.

## 핵심 경험

- **계획과 실제를 나란히 확인:** 예상 시간, 실제 시간, 차이를 할 일 단위로 비교합니다.
- **근거가 보이는 돌아보기:** 완료·지연·막힘·시간 집계를 선택하면 해당 원자료를 확인할 수 있습니다.
- **다음 계획으로 이어지는 개선점:** 사용자가 작성한 개선점을 다른 계획에 출처와 함께 전달합니다.
- **부담이 적은 기록 흐름:** 계획과 할 일을 관리하고, 상세 패널에서 실행 시간과 막힌 이유를 기록합니다.
- **새로고침 이후에도 유지되는 자료:** 모든 업무 자료를 서버 PostgreSQL에 저장합니다.
- **한 번에 내보내기:** 계획, 할 일, 실행 기록, 돌아보기를 단일 JSON 파일로 내려받습니다.

## 제공 기능

| 영역 | 기능 |
| --- | --- |
| 계획 | 기간, 우선순위, 성공 기준, 예상 시간, 수정 전 버전 보존 |
| 할 일 | 생성·조회·수정·삭제, 검색, 상태 필터, 태그, 마감일, 우선순위, 예상 시간 |
| 실행 | 시작·종료 시각, 실제 소요 시간, 막힌 이유, 여러 실행 기록 |
| 완료 | 빠른 중복 요청 방지, 완료 사건 보존, 다시 진행 중으로 변경 |
| 돌아보기 | 계획·완료·지연·막힘·예상·실제·차이 집계와 근거 탐색 |
| 개선 | 돌아보기 저장, 선택한 다음 계획으로 개선점 전달 |
| 내보내기 | ID, 날짜, 초 단위와 관계를 보존한 전체 JSON 다운로드 |

## 기술 구성

- Next.js 16 App Router, React 19, TypeScript
- Prisma ORM 7, PostgreSQL, Neon
- Wanted Sans, Tailwind CSS 4, Lucide Icons
- Vitest, Playwright, axe-core
- Vercel 배포 및 GitHub `main` 자동 배포

## 시작하기

### 준비 사항

- Node.js 24 이상
- pnpm 11 이상
- PostgreSQL 접속 문자열 또는 Prisma 로컬 개발 DB

### 설치 및 실행

```powershell
git clone https://github.com/hyeseong-dev/plandosee.git
Set-Location plandosee
pnpm install

# 로컬 Prisma Postgres를 시작하고 접속 환경을 준비합니다.
pnpm db:dev

# 스키마와 예제 데이터를 적용합니다.
pnpm db:migrate
$env:RESET_TEST_DATA="true"
pnpm db:seed

pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

기존 PostgreSQL을 사용하려면 `.env.example`을 `.env`로 복사한 뒤 `DATABASE_URL`을 실제 접속 문자열로 변경합니다. `.env`와 `.env.local`은 Git과 Vercel 업로드 대상에서 제외됩니다.

```powershell
Copy-Item .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## 명령어

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | Prisma Client 생성 후 프로덕션 빌드 |
| `pnpm lint` | ESLint 정적 검사 |
| `pnpm typecheck` | TypeScript 타입 검사 |
| `pnpm test` | Vitest 단위 테스트 |
| `pnpm test:e2e` | 테스트 데이터 초기화 후 로컬 Chromium E2E 실행 |
| `pnpm test:all` | 린트, 타입, 단위 테스트, 빌드, 로컬 E2E 전체 실행 |
| `pnpm db:migrate` | 개발 DB 마이그레이션 |
| `pnpm db:deploy` | 운영 DB의 대기 중인 마이그레이션 적용 |

## 테스트

전체 로컬 품질 게이트는 한 명령으로 실행합니다.

```powershell
pnpm test:all
```

배포된 서비스는 다음과 같이 별도로 검증할 수 있습니다.

```powershell
$env:PLAYWRIGHT_BASE_URL="https://plandosee-chi.vercel.app"
pnpm test:e2e:production
```

최종 검증 결과는 다음과 같습니다.

- 로컬: ESLint, TypeScript, 단위 테스트 8건, 프로덕션 빌드, Chromium E2E 6건 통과
- 운영: 익명 접근·접근성, Neon 실데이터·집계, 복원·내보내기, 비밀정보 노출 검증 4건 통과
- 근거 파일: [`plandosee-test-evidence.xlsx`](outputs/01a08aec-efc7-7340-b823-2e03084046dd/plandosee-test-evidence.xlsx)

## 프로젝트 구조

```text
plandosee/
├─ prisma/                  # 데이터 모델, 마이그레이션, 시드
├─ src/
│  ├─ app/                  # 화면과 Route Handlers
│  ├─ components/           # 플래너 UI와 입력 패널
│  └─ lib/                  # 도메인 계산, 검증, DB 접근
├─ tests/                   # Vitest 단위 테스트와 Playwright E2E
├─ docs/                    # 계획, 디자인, 요구사항, 검증·제출 문서
├─ outputs/                 # 테스트 근거 통합 문서
└─ constitution.txt         # 공통 과제 원문 44개 조건
```

## 데이터와 공개 범위

현재 버전에는 로그인 기능이 없습니다. 따라서 첫 화면에 아래 안내를 그대로 표시합니다.

> 지금은 로그인이 없어 링크를 아는 사람은 누구나 볼 수 있습니다. 남이 봐도 괜찮은 내용만 넣으세요

사용자 입력은 React의 기본 이스케이프를 유지하고 HTML로 직접 삽입하지 않습니다. DB 접속 문자열은 클라이언트 코드, API 응답, 콘솔, Git 이력에 포함하지 않으며 `.env*` 파일은 배포 업로드에서도 제외합니다.

## 프로젝트 문서

| 문서 | 내용 |
| --- | --- |
| [PROJECT_PLAN.md](docs/PROJECT_PLAN.md) | 제품 목표, 차별화, 화면 흐름, 데이터 설계, 단계별 실행 계획 |
| [DESIGN_SPEC.md](docs/DESIGN_SPEC.md) | 작은 정원 테마, 서체, 색상, 곡률, 반응형·접근성 기준 |
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | 과제 원문 ID를 유지한 검증 가능 요구사항 |
| [VERIFICATION.md](docs/VERIFICATION.md) | 정상·경계·동시성 검증 시나리오와 추적표 |
| [SUBMISSION.md](docs/SUBMISSION.md) | 제출 URL, AI 사용 기록, 최종 실행 결과 |

요구사항 작성 방법론은 제공된 [Notion 학습 자료](https://snowy-airplane-148.notion.site/1-3d70def9f626802a942fda0dc0fd4fd4)를 참고했습니다. 해당 자료는 조건을 작성하고 검토하는 방법으로만 활용했으며, 별도의 확정 요구사항으로 간주하지 않았습니다.
