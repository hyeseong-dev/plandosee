import "server-only";
import { prisma } from "./prisma";

export const workspaceInclude = {
  revisions: { orderBy: { version: "desc" as const } },
  todos: {
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
    include: {
      executionLogs: { orderBy: { startedAt: "asc" as const } },
      completionEvents: { orderBy: { completedAt: "asc" as const } },
    },
  },
  review: { include: { transfer: true } },
  transfersIn: { orderBy: { createdAt: "desc" as const } },
};

export async function loadWorkspace() {
  const plans = await prisma.plan.findMany({
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: workspaceInclude,
  });
  return { plans };
}
