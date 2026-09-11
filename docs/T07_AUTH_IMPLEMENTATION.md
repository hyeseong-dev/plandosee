# T07 인증 구현 설명서

작성일: 2026-09-11  
이어 사용한 최종 T06: `ae5abb4d216c28ba457665d99844e7b246598e76`

## ① 무엇으로 붙였나

이메일·비밀번호 인증과 DB 세션을 애플리케이션에 직접 구현했다. 비밀번호의 일방향 변환과 비교만 널리 쓰이는 `bcryptjs` **3.0.3** 라이브러리에 맡겼다. 세션 ID는 Node.js `crypto.randomBytes(32)`로 만든 256-bit 불투명 난수이며, 브라우저에는 `HttpOnly`, 운영 `Secure`, `SameSite=Lax` 쿠키로 전달한다. DB에는 세션 원문 대신 SHA-256 지문만 저장한다.

비밀번호 저장 예시는 다음처럼 원문이 아닌 bcrypt 결과다. 실제 값과 세션 값은 제출물에서 가렸다.

```text
email: o***@plandosee.local
passwordHash: $2b$12$[REDACTED]
session.tokenHash: [SHA-256 REDACTED]
```

## ② 왜 그걸 골랐나

`bcrypt` 계열은 계정마다 자동으로 다른 salt를 사용하고 cost factor로 계산 비용을 조절할 수 있어, 같은 비밀번호도 다른 저장값이 되며 원문으로 되돌릴 수 없다. 순수 JavaScript 구현인 `bcryptjs`는 현재 Vercel 런타임과 로컬 Windows에서 동일하게 동작하고 네이티브 바이너리 배포 차이를 줄여 선택했다.

함께 검토한 방법은 Auth.js와 Neon Auth다. 두 방법 모두 확장성은 좋지만, 이번 과제에서는 기존 T06 행의 최초 계정 인계, DB 세션 원문 지문 저장, 로그아웃·비밀번호 변경 직후 세션 폐기와 계정별 `404` 증거를 직접 설명해야 한다. 이 경계를 더 작고 명확하게 검증하기 위해 사용하지 않았다.

## ③ 어디를 어떻게 고쳤나

- 가입: `src/components/auth-screen.tsx` → `POST src/app/api/auth/signup/route.ts` → bcrypt hash → `User` 생성 → 첫 계정이면 소유자 없는 T06 `Plan` 인계 → 세션 생성
- 로그인: 같은 화면 → `POST src/app/api/auth/login/route.ts` → 존재 여부와 무관한 동일 오류 → bcrypt 비교 → 세션 생성
- 로그아웃: `src/components/planner-app.tsx` → `POST src/app/api/auth/logout/route.ts` → DB 세션 삭제와 쿠키 만료
- 자료 조회: `src/app/page.tsx`와 `src/app/api/workspace/route.ts` → `src/lib/auth.ts`의 현재 세션 확인 → `src/lib/workspace.ts`의 `where: { userId }`
- 자료 수정·삭제: `src/app/api/workspace/route.ts`, `src/app/api/plans/[id]/route.ts`에서 계획 또는 상위 계획의 `userId`를 현재 사용자와 함께 검사
- 비밀번호 변경·계정 삭제: `src/app/api/auth/password/route.ts`, `src/app/api/auth/account/route.ts`
- DB와 연쇄 삭제: `prisma/schema.prisma`, `prisma/migrations/20260911020000_add_auth_diary/migration.sql`

## ④ 안 열리는 것을 확인한 기록

값은 성공 응답과 거절 응답만 남기고 쿠키·비밀번호·세션 원문은 기록하지 않았다.

| 확인 | 성공 요청 | 거절 요청 |
| --- | --- | --- |
| 비로그인 경계 | 로그인 후 `GET /api/workspace` → 200 | 로그아웃 후 같은 `GET /api/workspace` → 401 |
| 로그인 오류 동일화 | 올바른 계정·비밀번호 → 200 | 없는 이메일과 틀린 비밀번호 모두 → 401, 같은 문구 |
| 세션 폐기 | 발급 직후 같은 자료 요청 → 200 | 로그아웃 또는 비밀번호 변경 뒤 이전 세션의 같은 요청 → 401 |
| A에서 B 차단 | A의 자기 계획 목록 → 200 | A로 B 계획 `GET/PATCH/DELETE /api/plans/[가림]` → 각각 404 |
| B에서 A 차단 | B의 자기 계획 목록 → 200 | B로 A 계획 `GET/PATCH/DELETE /api/plans/[가림]` → 각각 404 |

거절 전후 각 계정의 계획 수가 같고 상대 자료가 새로 생기지 않음을 E2E에서 함께 확인한다. URL query, `x-user-id`, `x-account` 헤더로 다른 계정을 주장해도 서버는 세션 사용자만 사용한다. 비로그인 직접 자료·내보내기 요청은 401이다. 목록 응답은 `src/lib/workspace.ts`의 사용자 필터 때문에 상대 계획을 포함하지 않는다.

## ⑤ AI와 나

- AI에게 맡긴 일: 요구사항 구조화, 인증·소유권 코드 초안, UI 구현, 자동화 테스트와 설명서 초안을 맡겼다.
- 내가 직접 판단한 일: 기존 T06을 유지하고 모던하고 귀여운 경험을 확장하며, 실제 5일 값은 임의로 만들지 않는 범위를 결정했다.
- AI 제안을 따르지 않은 일: 외부 인증 서비스의 빠른 도입보다 과제에서 요구한 저장·세션·소유권 경계를 직접 설명하고 검증할 수 있는 작은 구현을 선택했다.

## ⑥ 아직 못 막은 것

- 로그인 시도 속도 제한이 아직 없다. 공격자가 많은 비밀번호를 반복 대입할 수 있어 운영 전 IP·계정 단위 제한이 필요하다.
- 이메일 소유 확인과 비밀번호 복구가 아직 없다. 이메일 오입력 계정이나 비밀번호 분실 시 안전한 복구 경로가 없다.
- MFA와 기기별 세션 관리가 아직 없다. 비밀번호가 탈취되면 만료 전까지 공격자가 로그인할 위험이 있다.
- 이미 공개 T06 기간에 노출됐던 자료를 사후에 비공개로 되돌릴 수는 없다. T07 배포 뒤부터는 첫 화면이 로그인이고 자료 API가 세션을 요구한다.
