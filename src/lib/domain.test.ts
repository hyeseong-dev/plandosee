import { describe, expect, it } from "vitest";
import { calculateReview, formatDuration, seoulDateKey, type TodoDto } from "./domain";

const todo = ({ id, ...value }: Partial<TodoDto> & Pick<TodoDto, "id">): TodoDto => ({
  id, planId: "plan", content: id, status: "IN_PROGRESS", dueDate: null,
  priority: "MEDIUM", tags: [], estimatedSeconds: 0, completionCycle: 0, deletedAt: null,
  createdAt: "2026-09-10T00:00:00Z", updatedAt: "2026-09-10T00:00:00Z", executionLogs: [], completionEvents: [], ...value,
});

describe("calculateReview", () => {
  it("calculates the documented 5/2/1/2 and 90m/55m/-35m example", () => {
    const rows = [
      todo({ id: "1", status: "COMPLETED", dueDate: "2026-09-09", estimatedSeconds: 900, executionLogs: [{ id:"l1", todoId:"1", startedAt:"", endedAt:"", actualSeconds:1200, blockedReason:null, createdAt:"" }] }),
      todo({ id: "2", status: "COMPLETED", dueDate: "2026-09-10", estimatedSeconds: 1200, executionLogs: [{ id:"l2", todoId:"2", startedAt:"", endedAt:"", actualSeconds:900, blockedReason:"blocked", createdAt:"" }] }),
      todo({ id: "3", dueDate: "2026-09-09", estimatedSeconds: 1500, executionLogs: [{ id:"l3", todoId:"3", startedAt:"", endedAt:"", actualSeconds:1200, blockedReason:"blocked again", createdAt:"" }] }),
      todo({ id: "4", dueDate: "2026-09-11", estimatedSeconds: 600 }),
      todo({ id: "5", dueDate: "2026-09-12", estimatedSeconds: 1200 }),
      todo({ id: "6", dueDate: "2026-09-08", estimatedSeconds: 3600, deletedAt: "2026-09-10T00:00:00Z" }),
    ];
    expect(calculateReview(rows, "2026-09-10")).toEqual({ plannedCount:5, completedCount:2, overdueCount:1, blockedCount:2, estimatedSeconds:5400, actualSeconds:3300, differenceSeconds:-2100 });
  });
  it("returns zeros with no records", () => expect(calculateReview([], "2026-09-10")).toEqual({ plannedCount:0, completedCount:0, overdueCount:0, blockedCount:0, estimatedSeconds:0, actualSeconds:0, differenceSeconds:0 }));
  it("counts one blocked todo even with multiple blocked logs", () => expect(calculateReview([todo({ id:"1", executionLogs:[{id:"a",todoId:"1",startedAt:"",endedAt:"",actualSeconds:0,blockedReason:"a",createdAt:""},{id:"b",todoId:"1",startedAt:"",endedAt:"",actualSeconds:0,blockedReason:"b",createdAt:""}] })], "2026-09-10").blockedCount).toBe(1));
});

describe("date and duration rules", () => {
  it("uses Asia/Seoul across the UTC date boundary", () => expect(seoulDateKey(new Date("2026-09-09T15:01:00Z"))).toBe("2026-09-10"));
  it("preserves seconds and the sign", () => { expect(formatDuration(3661)).toBe("+1시간 1분 1초"); expect(formatDuration(-2100)).toBe("−35분"); expect(formatDuration(0)).toBe("0분"); });
});
