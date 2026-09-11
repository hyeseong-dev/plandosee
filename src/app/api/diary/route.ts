import { ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import { diaryCommandSchema } from "@/lib/diary-validation";
import { unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const include = {
  entries: { orderBy: { date: "asc" as const } },
  ruleChange: true,
};
const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function readStudy(userId: string) {
  return prisma.diaryStudy.findUnique({ where: { userId }, include });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  return Response.json({ study: await readStudy(user.id) }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  try {
    const command = diaryCommandSchema.parse(await request.json());
    if (command.action === "createStudy") {
      await prisma.diaryStudy.create({
        data: { userId: user.id, weekStartsOn: "MONDAY", ...command.data },
      });
    }
    if (command.action === "saveEntry") {
      const study = await readStudy(user.id);
      if (!study) return Response.json({ error: "먼저 관찰 질문을 정해 주세요." }, { status: 400 });
      const existing = study.entries.find((entry) => entry.date.toISOString().slice(0, 10) === command.data.date);
      if (!existing && study.entries.length >= 5) {
        return Response.json({ error: "실제 날짜 5일 기록이 이미 완성됐어요." }, { status: 400 });
      }
      if (!existing && study.entries.length === 2 && !study.ruleChange) {
        return Response.json({ error: "3일차를 적기 전에 계획 규칙 변경을 기록해 주세요." }, { status: 400 });
      }
      await prisma.diaryEntry.upsert({
        where: { studyId_date: { studyId: study.id, date: day(command.data.date) } },
        create: { studyId: study.id, date: day(command.data.date), value: command.data.value, note: command.data.note },
        update: { value: command.data.value, note: command.data.note },
      });
    }
    if (command.action === "saveRuleChange") {
      const study = await readStudy(user.id);
      if (!study) return Response.json({ error: "먼저 관찰 질문을 정해 주세요." }, { status: 400 });
      if (study.entries.length !== 2 || study.ruleChange) {
        return Response.json({ error: "규칙 변경은 2일차 기록 뒤, 3일차 기록 전에 한 번만 남길 수 있어요." }, { status: 400 });
      }
      await prisma.diaryRuleChange.create({
        data: {
          studyId: study.id,
          changedAt: new Date(),
          sourceEntryIds: study.entries.map((entry) => entry.id),
          ...command.data,
        },
      });
    }
    return Response.json({ study: await readStudy(user.id) });
  } catch (error) {
    const message = error instanceof ZodError
      ? error.issues[0]?.message ?? "입력값을 확인해 주세요."
      : "5일 기록을 저장하지 못했어요.";
    console.error("diary:post", "diary request failed");
    return Response.json({ error: message }, { status: 400 });
  }
}
