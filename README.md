# PlanDoSee

계획(Plan)과 실행(Do)을 나란히 기록하고, 돌아보기(See)에서 얻은 개선점 한 가지를 다음 계획으로 이어가는 작은 정원형 플래너입니다.

모던하면서도 귀여운 인상, 선명한 한글 글꼴, 둥글고 편안한 조작감을 사용합니다. 공통 과제의 44개 원칙은 [`constitution.txt`](constitution.txt)를 기준으로 추적합니다.

## 주요 기능

- 계획 기간·우선순위·성공 기준·예상 시간 작성과 수정 이력 보존
- 할 일 CRUD, 검색, 상태 필터, 명시적 정렬, 태그·마감일·예상 시간
- 실행 시작·종료·실제 시간·막힌 이유 기록
- 중복 완료 요청 방지와 완료 이벤트 보존
- 계획·완료·지연·막힘·예상/실제/차이 집계 및 원자료 이동
- 돌아보기 저장, 다음 계획으로 개선점 전달
- 전체 데이터를 단일 JSON 파일로 내보내기

## 로컬 실행

필수 조건은 Node.js 24+, pnpm 11+, Prisma Postgres입니다.

```powershell
pnpm install
pnpm db:dev
pnpm db:migrate
$env:RESET_TEST_DATA="true"; pnpm db:seed
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 로컬 DB 접속 문자열은 `.env`에만 두며 저장소에 커밋하지 않습니다.

## 검증

```powershell
pnpm test:all
```

명령은 린트, 타입 검사, 단위 테스트, 프로덕션 빌드, Chromium E2E를 차례로 실행합니다. 실행 근거와 운영 검증 결과는 배포 완료 후 생성되는 `outputs`의 엑셀 파일에 기록합니다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) | 제품 목표, 차별화, 화면 흐름, 데이터 설계, 단계별 산출물 |
| [`docs/DESIGN_SPEC.md`](docs/DESIGN_SPEC.md) | 테마, 화면 구성, 한글 서체, 색상, 곡률, 접근성 |
| [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) | 원문 ID와 검증 가능한 요구사항 |
| [`docs/VERIFICATION.md`](docs/VERIFICATION.md) | 정상·경계·동시성 검증 시나리오와 추적표 |
| [`docs/SUBMISSION.md`](docs/SUBMISSION.md) | 최종 확인 안내, AI 사용 기록, 제출 URL과 결과 |

## 데이터·보안 원칙

첫 화면에는 다음 안내를 그대로 표시합니다.

> 지금은 로그인이 없어 링크를 아는 사람은 누구나 볼 수 있습니다. 남이 봐도 괜찮은 내용만 넣으세요

React의 기본 텍스트 이스케이프를 유지하며 사용자 입력을 HTML로 삽입하지 않습니다. 서버 DB 비밀값은 클라이언트 코드, 빌드 산출물, 네트워크 응답, 콘솔, Git 이력에 포함하지 않습니다.

참고 방법론: [요구사항 공학 학습 자료](https://snowy-airplane-148.notion.site/1-3d70def9f626802a942fda0dc0fd4fd4). 이 자료는 조건 작성·검토 방법으로만 활용했고 별도의 확정 규칙으로 간주하지 않았습니다.
