import { describe, expect, it } from "vitest";
import { executionInput, planInput, todoInput } from "./validation";

describe("validation", () => {
  it("rejects a plan whose end precedes its start", () => expect(planInput.safeParse({ title:"x", startDate:"2026-09-11", endDate:"2026-09-10", priority:"HIGH", successCriteria:"done", estimatedSeconds:0 }).success).toBe(false));
  it("accepts one-second precision", () => expect(todoInput.safeParse({ planId:"10000000-0000-4000-8000-000000000001", content:"x", dueDate:null, priority:"LOW", tags:[], estimatedSeconds:1 }).success).toBe(true));
  it("rejects an execution with a negative duration", () => expect(executionInput.safeParse({ todoId:"20000000-0000-4000-8000-000000000001", startedAt:"2026-09-10T01:00:01Z", endedAt:"2026-09-10T01:00:00Z", blockedReason:null }).success).toBe(false));
});
