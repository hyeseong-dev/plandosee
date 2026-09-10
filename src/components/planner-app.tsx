"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Download,
  Leaf,
  Plus,
  Sprout,
  TriangleAlert,
  X,
} from "lucide-react";
import clsx from "clsx";
import {
  calculateReview,
  dateKey,
  seoulDateKey,
  type TodoDto,
  type WorkspaceDto,
} from "@/lib/domain";
import {
  EmptyWorkspace,
  LoadingState,
  PlanView,
  ReviewView,
  TodayView,
} from "./views";
import { ExecutionDialog, PlanDialog, TodoDialog } from "./dialogs";

export type Metric =
  | "planned"
  | "completed"
  | "overdue"
  | "blocked"
  | "estimated"
  | "actual"
  | "difference";
type View = "today" | "plan" | "review";
type DialogName = null | "plan" | "todo" | "execution";

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "요청을 처리하지 못했어요.");
  return data;
}

export function PlannerApp() {
  const [workspace, setWorkspace] = useState<WorkspaceDto | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [view, setView] = useState<View>("today");
  const [dialog, setDialog] = useState<DialogName>(null);
  const [editingTodo, setEditingTodo] = useState<TodoDto | null>(null);
  const [executionTodo, setExecutionTodo] = useState<TodoDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [metric, setMetric] = useState<Metric | null>(null);

  useEffect(() => {
    fetch("/api/workspace", { cache: "no-store" })
      .then(readJson)
      .then((data: WorkspaceDto) => {
        setWorkspace(data);
        const today = seoulDateKey();
        const activePlan = data.plans.find(
          (plan) =>
            dateKey(plan.startDate)! <= today &&
            dateKey(plan.endDate)! >= today,
        );
        setSelectedPlanId(
          (current) => current || activePlan?.id || data.plans[0]?.id || "",
        );
      })
      .catch((reason: Error) => {
        setWorkspace({ plans: [] });
        setError(reason.message);
      });
  }, []);

  const selectedPlan =
    workspace?.plans.find((plan) => plan.id === selectedPlanId) ??
    workspace?.plans[0] ??
    null;
  const activeTodos = useMemo(
    () => selectedPlan?.todos.filter((todo) => !todo.deletedAt) ?? [],
    [selectedPlan],
  );
  const metrics = useMemo(() => calculateReview(activeTodos), [activeTodos]);
  const visibleTodos = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ko");
    const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return [...activeTodos]
      .filter(
        (todo) =>
          !query ||
          todo.content.toLocaleLowerCase("ko").includes(query) ||
          todo.tags.some((tag) => tag.toLocaleLowerCase("ko").includes(query)),
      )
      .filter((todo) => statusFilter === "ALL" || todo.status === statusFilter)
      .filter(
        (todo) => priorityFilter === "ALL" || todo.priority === priorityFilter,
      )
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "IN_PROGRESS" ? -1 : 1;
        const dueA = dateKey(a.dueDate) ?? "9999-12-31";
        const dueB = dateKey(b.dueDate) ?? "9999-12-31";
        if (dueA !== dueB) return dueA.localeCompare(dueB);
        if (a.priority !== b.priority)
          return rank[a.priority] - rank[b.priority];
        return (
          a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
        );
      });
  }, [activeTodos, search, statusFilter, priorityFilter]);

  async function command(payload: object, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = (await readJson(
        await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      )) as WorkspaceDto;
      setWorkspace(data);
      if (!selectedPlanId && data.plans[0]) setSelectedPlanId(data.plans[0].id);
      setNotice(success);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "저장하지 못했어요.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openTodo(todo: TodoDto | null = null) {
    setEditingTodo(todo);
    setDialog("todo");
  }
  function openExecution(todo: TodoDto) {
    setExecutionTodo(todo);
    setDialog("execution");
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button
          className="brand"
          onClick={() => setView("today")}
          aria-label="오늘 화면으로"
        >
          <span className="brand-mark">
            <Sprout size={22} />
          </span>
          <span>plandosee</span>
        </button>
        <nav aria-label="주요 메뉴">
          {(
            [
              ["today", "오늘"],
              ["plan", "계획"],
              ["review", "돌아보기"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={clsx("nav-item", view === key && "active")}
              onClick={() => {
                setView(key);
                setMetric(null);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <a
          className="icon-button export-button"
          href="/api/export"
          download
          aria-label="내 자료 전체를 파일로 내보내기"
        >
          <Download size={19} />
          <span>내보내기</span>
        </a>
      </header>
      <main>
        <section className="privacy-notice" aria-label="공개 안내">
          <Leaf size={20} aria-hidden="true" />
          <p>
            지금은 로그인이 없어 링크를 아는 사람은 누구나 볼 수 있습니다. 남이
            봐도 괜찮은 내용만 넣으세요
          </p>
        </section>
        {error && (
          <div className="toast error" role="alert">
            <TriangleAlert size={18} />
            {error}
            <button onClick={() => setError("")} aria-label="오류 닫기">
              <X size={16} />
            </button>
          </div>
        )}
        {notice && (
          <div className="toast success" role="status">
            <Check size={18} />
            {notice}
          </div>
        )}
        {workspace === null ? (
          <LoadingState />
        ) : workspace.plans.length === 0 ? (
          <EmptyWorkspace onCreate={() => setDialog("plan")} />
        ) : selectedPlan ? (
          <>
            <section className="plan-switcher">
              <div>
                <span className="eyebrow">지금 보고 있는 계획</span>
                <select
                  value={selectedPlan.id}
                  onChange={(event) => {
                    setSelectedPlanId(event.target.value);
                    setMetric(null);
                  }}
                  aria-label="계획 선택"
                >
                  {workspace.plans.map((plan) => (
                    <option value={plan.id} key={plan.id}>
                      {plan.title}
                    </option>
                  ))}
                </select>
                <span className="plan-period">
                  <CalendarDays size={15} />
                  {dateKey(selectedPlan.startDate)} –{" "}
                  {dateKey(selectedPlan.endDate)}
                </span>
              </div>
              <button
                className="secondary-button"
                onClick={() => setDialog("plan")}
              >
                <Plus size={18} />새 계획
              </button>
            </section>
            {view === "today" && (
              <TodayView
                plan={selectedPlan}
                todos={visibleTodos}
                total={activeTodos.length}
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                busy={busy}
                onAdd={() => openTodo()}
                onEdit={openTodo}
                onExecution={openExecution}
                onComplete={(todo) =>
                  command(
                    {
                      action:
                        todo.status === "COMPLETED"
                          ? "reopenTodo"
                          : "completeTodo",
                      id: todo.id,
                    },
                    todo.status === "COMPLETED"
                      ? "다시 진행 중으로 바꿨어요."
                      : "완료로 기록했어요.",
                  )
                }
                onDelete={(todo) =>
                  command(
                    { action: "deleteTodo", id: todo.id },
                    "할 일을 목록에서 지웠어요.",
                  )
                }
                goReview={() => setView("review")}
              />
            )}
            {view === "plan" && (
              <PlanView plan={selectedPlan} onEdit={() => setDialog("plan")} />
            )}
            {view === "review" && (
              <ReviewView
                key={selectedPlan.id}
                plan={selectedPlan}
                plans={workspace.plans}
                metrics={metrics}
                metric={metric}
                setMetric={setMetric}
                busy={busy}
                command={command}
              />
            )}
          </>
        ) : null}
      </main>
      {dialog === "plan" && (
        <PlanDialog
          plan={
            workspace?.plans.find((item) => item.id === selectedPlanId) ?? null
          }
          busy={busy}
          onClose={() => setDialog(null)}
          onSave={async (payload, id) => {
            const ok = await command(
              id
                ? { action: "updatePlan", id, data: payload }
                : { action: "createPlan", data: payload },
              id
                ? "계획을 고치고 이전 값을 보존했어요."
                : "새 계획을 만들었어요.",
            );
            if (ok) setDialog(null);
          }}
        />
      )}
      {dialog === "todo" && selectedPlan && (
        <TodoDialog
          todo={editingTodo}
          busy={busy}
          onClose={() => setDialog(null)}
          onSave={async (payload, id) => {
            const ok = await command(
              id
                ? { action: "updateTodo", id, data: payload }
                : {
                    action: "createTodo",
                    data: { ...payload, planId: selectedPlan.id },
                  },
              id ? "할 일을 고쳤어요." : "할 일을 심었어요.",
            );
            if (ok) setDialog(null);
          }}
        />
      )}
      {dialog === "execution" && executionTodo && (
        <ExecutionDialog
          todo={executionTodo}
          busy={busy}
          onClose={() => setDialog(null)}
          onSave={async (payload) => {
            const ok = await command(
              {
                action: "createExecution",
                data: { ...payload, todoId: executionTodo.id },
              },
              "실제로 한 일을 기록했어요.",
            );
            if (ok) setDialog(null);
          }}
        />
      )}
    </div>
  );
}
