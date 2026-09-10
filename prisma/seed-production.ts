import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (process.env.ALLOW_PRODUCTION_SEED !== "true") throw new Error("Set ALLOW_PRODUCTION_SEED=true explicitly.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const at = (value: string) => new Date(value);

const planId = "41000000-0000-4000-8000-000000000001";
const nextPlanId = "41000000-0000-4000-8000-000000000002";

async function main() {
  await prisma.plan.upsert({
    where: { id: planId },
    update: {},
    create: {
      id: planId,
      title: "PlanDoSee 프로젝트 구현·배포",
      startDate: date("2026-09-10"),
      endDate: date("2026-09-12"),
      priority: "HIGH",
      successCriteria: "GitHub 공개 소스와 Vercel 운영 URL을 익명으로 열 수 있고, 로컬·운영 테스트와 엑셀 근거 및 이메일 보고를 완료한다.",
      estimatedSeconds: 21600,
    },
  });
  await prisma.plan.upsert({
    where: { id: nextPlanId },
    update: {},
    create: {
      id: nextPlanId,
      title: "PlanDoSee 운영 개선",
      startDate: date("2026-09-13"),
      endDate: date("2026-09-19"),
      priority: "MEDIUM",
      successCriteria: "운영 검증에서 확인한 개선점 한 가지를 다음 계획에 반영한다.",
      estimatedSeconds: 3600,
    },
  });

  const todos = [
    ["42000000-0000-4000-8000-000000000001", "GitHub 저장소와 초기 구성", "COMPLETED", "2026-09-10", "HIGH", ["git", "초기화"], 1800],
    ["42000000-0000-4000-8000-000000000002", "핵심 기능과 부드러운 UI 구현", "COMPLETED", "2026-09-10", "HIGH", ["개발", "디자인"], 10800],
    ["42000000-0000-4000-8000-000000000003", "로컬 자동화 테스트와 엑셀 근거", "COMPLETED", "2026-09-10", "HIGH", ["테스트", "근거"], 3600],
    ["42000000-0000-4000-8000-000000000004", "Vercel 운영 DB와 앱 배포", "IN_PROGRESS", "2026-09-11", "HIGH", ["배포", "DB"], 2400],
    ["42000000-0000-4000-8000-000000000005", "익명 운영 환경 최종 테스트", "IN_PROGRESS", "2026-09-11", "HIGH", ["운영", "테스트"], 1800],
    ["42000000-0000-4000-8000-000000000006", "미흡 요인 수정과 재검증", "IN_PROGRESS", "2026-09-12", "MEDIUM", ["품질"], 900],
    ["42000000-0000-4000-8000-000000000007", "완료 이메일 전송", "IN_PROGRESS", "2026-09-12", "MEDIUM", ["보고"], 300],
  ] as const;

  for (const [id, content, status, dueDate, priority, tags, estimatedSeconds] of todos) {
    await prisma.todo.upsert({
      where: { id },
      update: {},
      create: { id, planId, content, status, dueDate: date(dueDate), priority, tags: [...tags], estimatedSeconds, completionCycle: status === "COMPLETED" ? 1 : 0 },
    });
    if (status === "COMPLETED") {
      await prisma.completionEvent.upsert({
        where: { todoId_cycle: { todoId: id, cycle: 1 } },
        update: {},
        create: { todoId: id, cycle: 1 },
      });
    }
  }

  const logs = [
    ["43000000-0000-4000-8000-000000000001", todos[0][0], "2026-09-10T12:03:23.000Z", "2026-09-10T12:10:23.000Z", 420, null],
    ["43000000-0000-4000-8000-000000000002", todos[1][0], "2026-09-10T11:18:20.000Z", "2026-09-10T13:28:47.000Z", 7827, "초기 E2E에서 활성 계획 선택·시간 입력 단위·색상 대비를 조정했음"],
    ["43000000-0000-4000-8000-000000000003", todos[2][0], "2026-09-10T13:35:52.000Z", "2026-09-10T13:36:14.000Z", 22, "통합 실행에서 Vitest가 Playwright 파일을 함께 수집해 테스트 범위를 분리했음"],
  ] as const;
  for (const [id, todoId, startedAt, endedAt, actualSeconds, blockedReason] of logs) {
    await prisma.executionLog.upsert({ where: { id }, update: {}, create: { id, todoId, startedAt: at(startedAt), endedAt: at(endedAt), actualSeconds, blockedReason } });
  }

  await prisma.review.upsert({
    where: { planId },
    update: {},
    create: {
      planId,
      reflection: "로컬 통합 검증에서 테스트 러너 범위 충돌을 발견해 분리했고, 같은 전체 명령을 다시 실행해 단위 8건과 E2E 6건을 모두 통과했다.",
      improvement: "운영 환경에서는 익명 접근, DB 복원, 집계 근거, 비밀정보 노출 여부를 우선 재검증한다.",
    },
  });
}

main().finally(() => prisma.$disconnect());
