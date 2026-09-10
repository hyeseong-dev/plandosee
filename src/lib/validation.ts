import { z } from "zod";
import { priorities } from "./domain";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const id = z.string().uuid();

export const planInput = z.object({
  title: z.string().trim().min(1).max(120), startDate: dateOnly, endDate: dateOnly,
  priority: z.enum(priorities), successCriteria: z.string().trim().min(1).max(1000),
  estimatedSeconds: z.number().int().min(0).max(31_536_000),
}).refine((value) => value.startDate <= value.endDate, {
  message: "끝나는 날은 시작하는 날보다 빠를 수 없어요.", path: ["endDate"],
});

export const todoInput = z.object({
  planId: id, content: z.string().trim().min(1).max(500), dueDate: dateOnly.nullable(),
  priority: z.enum(priorities), tags: z.array(z.string().trim().min(1).max(30)).max(10),
  estimatedSeconds: z.number().int().min(0).max(2_592_000),
});

export const executionInput = z.object({
  todoId: id, startedAt: z.string().datetime({ offset: true }), endedAt: z.string().datetime({ offset: true }),
  blockedReason: z.string().trim().max(1000).nullable(),
}).refine((value) => new Date(value.endedAt).getTime() >= new Date(value.startedAt).getTime(), {
  message: "끝난 시각은 시작 시각보다 빠를 수 없어요.", path: ["endedAt"],
});

export const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("createPlan"), data: planInput }),
  z.object({ action: z.literal("updatePlan"), id, data: planInput }),
  z.object({ action: z.literal("createTodo"), data: todoInput }),
  z.object({ action: z.literal("updateTodo"), id, data: todoInput.omit({ planId: true }) }),
  z.object({ action: z.literal("deleteTodo"), id }),
  z.object({ action: z.literal("completeTodo"), id }),
  z.object({ action: z.literal("reopenTodo"), id }),
  z.object({ action: z.literal("createExecution"), data: executionInput }),
  z.object({ action: z.literal("saveReview"), planId: id, data: z.object({
    reflection: z.string().max(3000), improvement: z.string().trim().max(1000),
  }) }),
  z.object({ action: z.literal("transferImprovement"), reviewId: id, targetPlanId: id }),
]);
