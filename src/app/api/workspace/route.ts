import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { loadWorkspace } from "@/lib/workspace";
import { commandSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

export async function GET() {
  try {
    return NextResponse.json(await loadWorkspace(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("workspace:get", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "저장소에서 자료를 불러오지 못했어요." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const command = commandSchema.parse(await request.json());

    switch (command.action) {
      case "createPlan":
        await prisma.plan.create({ data: {
          ...command.data,
          startDate: day(command.data.startDate),
          endDate: day(command.data.endDate),
        } });
        break;
      case "updatePlan":
        await prisma.$transaction(async (tx) => {
          const current = await tx.plan.findUniqueOrThrow({ where: { id: command.id } });
          await tx.planRevision.create({ data: {
            planId: current.id,
            version: current.version,
            title: current.title,
            startDate: current.startDate,
            endDate: current.endDate,
            priority: current.priority,
            successCriteria: current.successCriteria,
            estimatedSeconds: current.estimatedSeconds,
          } });
          await tx.plan.update({
            where: { id: command.id },
            data: {
              ...command.data,
              startDate: day(command.data.startDate),
              endDate: day(command.data.endDate),
              version: { increment: 1 },
            },
          });
        });
        break;
      case "createTodo":
        await prisma.todo.create({ data: {
          ...command.data,
          dueDate: command.data.dueDate ? day(command.data.dueDate) : null,
        } });
        break;
      case "updateTodo":
        await prisma.todo.update({
          where: { id: command.id, deletedAt: null },
          data: { ...command.data, dueDate: command.data.dueDate ? day(command.data.dueDate) : null },
        });
        break;
      case "deleteTodo":
        await prisma.todo.update({ where: { id: command.id }, data: { deletedAt: new Date() } });
        break;
      case "completeTodo":
        await prisma.$transaction(async (tx) => {
          const todo = await tx.todo.findUniqueOrThrow({ where: { id: command.id } });
          if (todo.deletedAt || todo.status === "COMPLETED") return;
          const nextCycle = todo.completionCycle + 1;
          const changed = await tx.todo.updateMany({
            where: { id: todo.id, status: "IN_PROGRESS", completionCycle: todo.completionCycle, deletedAt: null },
            data: { status: "COMPLETED", completionCycle: nextCycle },
          });
          if (changed.count === 1) {
            await tx.completionEvent.create({ data: { todoId: todo.id, cycle: nextCycle } });
          }
        });
        break;
      case "reopenTodo":
        await prisma.todo.updateMany({
          where: { id: command.id, deletedAt: null }, data: { status: "IN_PROGRESS" },
        });
        break;
      case "createExecution": {
        const startedAt = new Date(command.data.startedAt);
        const endedAt = new Date(command.data.endedAt);
        const actualSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
        await prisma.executionLog.create({ data: {
          todoId: command.data.todoId,
          startedAt,
          endedAt,
          actualSeconds,
          blockedReason: command.data.blockedReason || null,
        } });
        break;
      }
      case "saveReview":
        await prisma.review.upsert({
          where: { planId: command.planId },
          create: { planId: command.planId, ...command.data },
          update: command.data,
        });
        break;
      case "transferImprovement": {
        const review = await prisma.review.findUniqueOrThrow({ where: { id: command.reviewId } });
        if (!review.improvement.trim()) throw new Error("먼저 고칠 점을 적어 주세요.");
        if (review.planId === command.targetPlanId) throw new Error("다른 계획을 선택해 주세요.");
        await prisma.improvementTransfer.upsert({
          where: { reviewId: review.id },
          create: { reviewId: review.id, targetPlanId: command.targetPlanId, content: review.improvement },
          update: { targetPlanId: command.targetPlanId, content: review.improvement },
        });
        break;
      }
    }

    return NextResponse.json(await loadWorkspace());
  } catch (error) {
    const message = error instanceof ZodError
      ? error.issues[0]?.message ?? "입력값을 확인해 주세요."
      : error instanceof Error && !error.message.includes("prisma")
        ? error.message
        : "요청을 저장하지 못했어요.";
    console.error("workspace:post", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
