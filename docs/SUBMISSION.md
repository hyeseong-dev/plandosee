# PlanDoSee 최종 확인·제출 기록

작성일: 2026-09-11

## 짧은 최종 확인 안내

- **어디에서:** 제출된 Vercel URL을 시크릿/인프라이빗 창에서 엽니다.
- **행동(3단계):** ① 계획과 할 일을 하나 작성합니다. ② 실행 기록을 남기고 할 일을 완료합니다. ③ 새로고침한 뒤 돌아보기에서 수치와 근거를 누르고 전체 데이터를 내보냅니다.
- **통과 기준:** 공개 안내가 보이고, 새로고침 뒤 ID·날짜·값·단위가 유지되며, 돌아보기 수치와 원자료가 일치하고 JSON 한 파일이 내려받아집니다.
- **실패 기준:** 로그인·권한이 필요하거나, 새로고침 시 값이 사라지거나, 집계와 근거가 다르거나, 입력 문자열이 코드로 실행되면 실패입니다.

## AI 사용 기록

- **AI에게 맡긴 일:** 제공된 요구사항 자료 검토, 구현 계획·명세 작성, Next.js/Prisma 앱 구현, 자동화 테스트 작성·실행, 배포와 테스트 근거 문서 초안 작성을 맡겼습니다.
- **사용자가 직접 결정한 일:** 모던하고 귀여운 테마, 낡아 보이지 않는 명확한 글꼴, 딱딱하고 각진 UI 지양, 원칙 준수, 그리고 로컬 구현·검증 → Vercel 배포·운영 검증 → 이메일 완료 보고의 진행 순서를 직접 결정했습니다.
- **AI 제안 중 채택하지 않은 내용:** 명시적으로 거절된 제안은 없습니다. 과제 원문이나 사용자 결정에 없는 세부 설계는 AI 제안으로 구분했고, 원칙과 충돌하는 확장 기능은 넣지 않았습니다.

## 제출 URL

- GitHub 저장소: https://github.com/hyeseong-dev/plandosee
- Vercel 운영 URL: https://plandosee-chi.vercel.app

## 실행 결과

- 로컬 통합 검증: `pnpm test:all` 통과 — ESLint, TypeScript, 단위 테스트 8건, Next.js 프로덕션 빌드, Chromium E2E 6건
- 운영 환경 검증: `PLAYWRIGHT_BASE_URL=https://plandosee-chi.vercel.app pnpm test:e2e:production` 통과 — Chromium E2E 4건
- 운영 재검증 이력: 최초 실행에서 화면 locator, 비동기 로딩 대기, 내보내기 필드 경로 등 검증 코드 3건을 보완한 뒤 4/4 통과
- Git 자동 배포 검증: clean checkout에서 Prisma Client 생성 누락을 발견해 빌드 명령을 보완했고, GitHub `main` 자동 배포 `READY`와 운영 E2E 4/4 재통과를 확인
- 엑셀 근거 파일: `outputs/01a08aec-efc7-7340-b823-2e03084046dd/plandosee-test-evidence.xlsx`
