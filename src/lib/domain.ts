export const priorities = ["HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof priorities)[number];
export type TodoStatus = "IN_PROGRESS" | "COMPLETED";

export type ExecutionLogDto = {
  id: string; todoId: string; startedAt: string; endedAt: string;
  actualSeconds: number; blockedReason: string | null; createdAt: string;
};

export type TodoDto = {
  id: string; planId: string; content: string; status: TodoStatus;
  dueDate: string | null; priority: Priority; tags: string[];
  estimatedSeconds: number; completionCycle: number; deletedAt: string | null;
  createdAt: string; updatedAt: string; executionLogs: ExecutionLogDto[];
  completionEvents: Array<{ id: string; cycle: number; completedAt: string }>;
};

export type PlanRevisionDto = {
  id: string; version: number; title: string; startDate: string; endDate: string;
  priority: Priority; successCriteria: string; estimatedSeconds: number; createdAt: string;
};

export type ReviewDto = {
  id: string; planId: string; reflection: string; improvement: string;
  transfer: null | { id: string; targetPlanId: string; content: string; createdAt: string };
};

export type PlanDto = {
  id: string; title: string; startDate: string; endDate: string; priority: Priority;
  successCriteria: string; estimatedSeconds: number; version: number;
  createdAt: string; updatedAt: string; revisions: PlanRevisionDto[]; todos: TodoDto[];
  review: ReviewDto | null;
  transfersIn: Array<{ id: string; content: string; createdAt: string; reviewId: string }>;
};

export type WorkspaceDto = { plans: PlanDto[] };
export type ReviewMetrics = {
  plannedCount: number; completedCount: number; overdueCount: number; blockedCount: number;
  estimatedSeconds: number; actualSeconds: number; differenceSeconds: number;
};

export function seoulDateKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function dateKey(value: string | Date | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

export function calculateReview(todos: TodoDto[], todayKey = seoulDateKey()): ReviewMetrics {
  const active = todos.filter((todo) => !todo.deletedAt);
  const completedCount = active.filter((todo) => todo.status === "COMPLETED").length;
  const overdueCount = active.filter((todo) => {
    const due = dateKey(todo.dueDate);
    return todo.status !== "COMPLETED" && due !== null && due < todayKey;
  }).length;
  const blockedCount = active.filter((todo) =>
    todo.executionLogs.some((log) => Boolean(log.blockedReason?.trim())),
  ).length;
  const estimatedSeconds = active.reduce((sum, todo) => sum + todo.estimatedSeconds, 0);
  const actualSeconds = active.reduce(
    (sum, todo) => sum + todo.executionLogs.reduce((logs, log) => logs + log.actualSeconds, 0), 0,
  );
  return { plannedCount: active.length, completedCount, overdueCount, blockedCount,
    estimatedSeconds, actualSeconds, differenceSeconds: actualSeconds - estimatedSeconds };
}

export function formatDuration(seconds: number): string {
  const sign = seconds < 0 ? "−" : seconds > 0 ? "+" : "";
  const absolute = Math.abs(seconds);
  const hours = Math.floor(absolute / 3600);
  const minutes = Math.floor((absolute % 3600) / 60);
  const rest = absolute % 60;
  const parts = [hours ? `${hours}시간` : "", minutes ? `${minutes}분` : "", rest ? `${rest}초` : ""].filter(Boolean);
  return `${sign}${parts.join(" ") || "0분"}`;
}

export function priorityLabel(priority: string): string {
  return priority === "HIGH" ? "높음" : priority === "LOW" ? "낮음" : "보통";
}
