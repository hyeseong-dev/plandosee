import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  throw new Error("Production seed is disabled.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const at = (value: string) => new Date(value);

async function main() {
  if (process.env.RESET_TEST_DATA === "true") {
    await prisma.plan.deleteMany();
  }

  const current = await prisma.plan.upsert({
    where: { id: "10000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "10000000-0000-4000-8000-000000000001",
      title: "PlanDoSee 1차 구현",
      startDate: date("2026-09-08"), endDate: date("2026-09-14"), priority: "HIGH",
      successCriteria: "로컬 테스트를 통과하고 배포 가능한 결과와 검증 근거를 남긴다.", estimatedSeconds: 7200,
    },
  });
  const next = await prisma.plan.upsert({
    where: { id: "10000000-0000-4000-8000-000000000002" }, update: {},
    create: { id: "10000000-0000-4000-8000-000000000002", title: "PlanDoSee 다음 개선", startDate: date("2026-09-15"), endDate: date("2026-09-21"), priority: "MEDIUM", successCriteria: "첫 운영 피드백 한 가지를 다음 계획에 반영한다.", estimatedSeconds: 3600 },
  });

  const todos = [
    ["20000000-0000-4000-8000-000000000001", "프로젝트 문서와 원칙 확인", "COMPLETED", "2026-09-09", "HIGH", ["문서"], 900],
    ["20000000-0000-4000-8000-000000000002", "데이터 모델과 API 구현", "COMPLETED", "2026-09-10", "HIGH", ["개발", "서버"], 1200],
    ["20000000-0000-4000-8000-000000000003", "모던하고 귀여운 화면 구현", "IN_PROGRESS", "2026-09-09", "MEDIUM", ["개발", "디자인"], 1500],
    ["20000000-0000-4000-8000-000000000004", "로컬 자동화 테스트", "IN_PROGRESS", "2026-09-11", "HIGH", ["테스트"], 600],
    ["20000000-0000-4000-8000-000000000005", "Vercel 운영 배포", "IN_PROGRESS", "2026-09-12", "MEDIUM", ["배포"], 1200],
    ["20000000-0000-4000-8000-000000000006", "삭제 집계 제외 확인", "IN_PROGRESS", "2026-09-08", "LOW", ["테스트"], 3600],
  ] as const;
  for (const [id, content, status, due, priority, tags, estimatedSeconds] of todos) {
    await prisma.todo.upsert({ where: { id }, update: {}, create: { id, planId: current.id, content, status, dueDate: date(due), priority, tags: [...tags], estimatedSeconds, completionCycle: status === "COMPLETED" ? 1 : 0, deletedAt: id.endsWith("6") ? at("2026-09-10T01:00:00.000Z") : null } });
  }

  for (const todoId of ["20000000-0000-4000-8000-000000000001", "20000000-0000-4000-8000-000000000002"]) {
    await prisma.completionEvent.upsert({ where: { todoId_cycle: { todoId, cycle: 1 } }, update: {}, create: { todoId, cycle: 1 } });
  }
  const logs = [
    ["30000000-0000-4000-8000-000000000001", "20000000-0000-4000-8000-000000000001", "2026-09-10T00:00:00.000Z", "2026-09-10T00:20:00.000Z", 1200, null],
    ["30000000-0000-4000-8000-000000000002", "20000000-0000-4000-8000-000000000002", "2026-09-10T00:30:00.000Z", "2026-09-10T00:45:00.000Z", 900, "DB 연결 설정 확인이 필요했음"],
    ["30000000-0000-4000-8000-000000000003", "20000000-0000-4000-8000-000000000003", "2026-09-10T01:00:00.000Z", "2026-09-10T01:20:00.000Z", 1200, "모바일 간격 조정이 필요했음"],
  ] as const;
  for (const [id, todoId, startedAt, endedAt, actualSeconds, blockedReason] of logs) {
    await prisma.executionLog.upsert({ where: { id }, update: {}, create: { id, todoId, startedAt: at(startedAt), endedAt: at(endedAt), actualSeconds, blockedReason } });
  }
  await prisma.review.upsert({ where: { planId: current.id }, update: {}, create: { planId: current.id, reflection: "초기 문서를 먼저 구조화하니 구현 범위를 흔들림 없이 확인할 수 있었다.", improvement: "운영 검증에서는 모바일 화면과 새로고침 복원을 가장 먼저 확인한다." } });
  void next;
}

main().finally(() => prisma.$disconnect());
