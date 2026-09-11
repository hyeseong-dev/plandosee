import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { loadWorkspace } from "@/lib/workspace";
import { commandSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth";
import { notFound, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);
class OwnedResourceNotFound extends Error {}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    return NextResponse.json(await loadWorkspace(user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("workspace:get", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "저장소에서 자료를 불러오지 못했어요." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  try {
    const command = commandSchema.parse(await request.json());

    switch (command.action) {
      case "createPlan":
        await prisma.plan.create({ data: {
          ...command.data,
          userId: user.id,
          startDate: day(command.data.startDate),
          endDate: day(command.data.endDate),
        } });
        break;
      case "updatePlan":
        await prisma.$transaction(async (tx) => {
          const current = await tx.plan.findFirst({
            where: { id: command.id, userId: user.id },
          });
          if (!current) throw new OwnedResourceNotFound();
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
            where: { id: current.id },
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
        if (!await prisma.plan.findFirst({
          where: { id: command.data.planId, userId: user.id },
          select: { id: true },
        })) throw new OwnedResourceNotFound();
        await prisma.todo.create({ data: {
          ...command.data,
          dueDate: command.data.dueDate ? day(command.data.dueDate) : null,
        } });
        break;
      case "updateTodo":
        if ((await prisma.todo.updateMany({
          where: { id: command.id, deletedAt: null, plan: { userId: user.id } },
          data: { ...command.data, dueDate: command.data.dueDate ? day(command.data.dueDate) : null },
        })).count !== 1) throw new OwnedResourceNotFound();
        break;
      case "deleteTodo":
        if ((await prisma.todo.updateMany({
          where: { id: command.id, plan: { userId: user.id } },
          data: { deletedAt: new Date() },
        })).count !== 1) throw new OwnedResourceNotFound();
        break;
      case "completeTodo":
        await prisma.$transaction(async (tx) => {
          const todo = await tx.todo.findFirst({
            where: { id: command.id, plan: { userId: user.id } },
          });
          if (!todo) throw new OwnedResourceNotFound();
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
        if ((await prisma.todo.updateMany({
          where: { id: command.id, deletedAt: null, plan: { userId: user.id } },
          data: { status: "IN_PROGRESS" },
        })).count !== 1) throw new OwnedResourceNotFound();
        break;
      case "createExecution": {
        if (!await prisma.todo.findFirst({
          where: { id: command.data.todoId, plan: { userId: user.id } },
          select: { id: true },
        })) throw new OwnedResourceNotFound();
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
        if (!await prisma.plan.findFirst({
          where: { id: command.planId, userId: user.id },
          select: { id: true },
        })) throw new OwnedResourceNotFound();
        await prisma.review.upsert({
          where: { planId: command.planId },
          create: { planId: command.planId, ...command.data },
          update: command.data,
        });
        break;
      case "transferImprovement": {
        const review = await prisma.review.findFirst({
          where: { id: command.reviewId, plan: { userId: user.id } },
        });
        const target = await prisma.plan.findFirst({
          where: { id: command.targetPlanId, userId: user.id },
          select: { id: true },
        });
        if (!review || !target) throw new OwnedResourceNotFound();
        if (!review.improvement.trim()) throw new Error("먼저 고칠 점을 적어 주세요.");
        if (review.planId === target.id) throw new Error("다른 계획을 선택해 주세요.");
        await prisma.improvementTransfer.upsert({
          where: { reviewId: review.id },
          create: { reviewId: review.id, targetPlanId: target.id, content: review.improvement },
          update: { targetPlanId: target.id, content: review.improvement },
        });
        break;
      }
    }

    return NextResponse.json(await loadWorkspace(user.id));
  } catch (error) {
    if (error instanceof OwnedResourceNotFound) return notFound();
    const message = error instanceof ZodError
      ? error.issues[0]?.message ?? "입력값을 확인해 주세요."
      : error instanceof Error && !error.message.includes("prisma")
        ? error.message
        : "요청을 저장하지 못했어요.";
    console.error("workspace:post", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
