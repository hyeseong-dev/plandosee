"use client";

import { useState } from "react";
import {
  Archive,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  History,
  Leaf,
  ListFilter,
  Pencil,
  Plus,
  Search,
  Sprout,
  Tag,
  Timer,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import clsx from "clsx";
import {
  calculateReview,
  dateKey,
  formatDuration,
  priorityLabel,
  seoulDateKey,
  type PlanDto,
  type TodoDto,
} from "@/lib/domain";
import type { Metric } from "./planner-app";

const today = () => seoulDateKey();

export function LoadingState() {
  return (
    <section className="empty-state">
      <span className="seed-loader" />
      <h1>기록을 불러오고 있어요</h1>
    </section>
  );
}
export function EmptyWorkspace({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="empty-state">
      <span className="empty-plant">
        <Sprout size={52} />
      </span>
      <span className="eyebrow">나의 첫 기록</span>
      <h1>
        생각한 하루를
        <br />
        작게 심어볼까요?
      </h1>
      <p>계획을 만들면 할 일과 실제 시간을 함께 기록할 수 있어요.</p>
      <button className="primary-button" onClick={onCreate}>
        <Plus size={19} />첫 계획 만들기
      </button>
    </section>
  );
}

export function TodayView({
  plan,
  todos,
  total,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  busy,
  onAdd,
  onEdit,
  onExecution,
  onComplete,
  onDelete,
  goReview,
}: {
  plan: PlanDto;
  todos: TodoDto[];
  total: number;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  busy: boolean;
  onAdd: () => void;
  onEdit: (todo: TodoDto) => void;
  onExecution: (todo: TodoDto) => void;
  onComplete: (todo: TodoDto) => void;
  onDelete: (todo: TodoDto) => void;
  goReview: () => void;
}) {
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">서울 기준 {today()}</span>
          <h1>오늘의 계획과 실제</h1>
          <p>{plan.title}의 예상과 실제를 한 자리에서 비교해요.</p>
        </div>
        <button className="primary-button" onClick={onAdd}>
          <Plus size={19} />할 일 추가
        </button>
      </div>
      <div className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">할 일 검색</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="내용이나 태그 검색"
          />
        </label>
        <label>
          <ListFilter size={17} />
          <span className="sr-only">상태 필터</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">모든 상태</option>
            <option value="IN_PROGRESS">진행 중</option>
            <option value="COMPLETED">완료</option>
          </select>
        </label>
        <label>
          <span className="sr-only">우선순위 필터</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">모든 우선순위</option>
            <option value="HIGH">높음</option>
            <option value="MEDIUM">보통</option>
            <option value="LOW">낮음</option>
          </select>
        </label>
      </div>
      <p className="sort-note">
        {todos.length}/{total}개 · 정렬: 미완료 먼저 → 마감 빠른순 → 높은
        우선순위 → 만든 순서
      </p>
      <div className="todo-list">
        {todos.length ? (
          todos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              busy={busy}
              onEdit={onEdit}
              onExecution={onExecution}
              onComplete={onComplete}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="list-empty">
            <Sprout size={30} />
            <strong>맞는 할 일이 없어요.</strong>
            <span>검색어나 필터를 바꾸거나 새 할 일을 추가해 보세요.</span>
          </div>
        )}
      </div>
      <button className="review-bridge" onClick={goReview}>
        <span>
          <Leaf size={22} />
          <span>
            <strong>이 계획, 어떻게 흘러가고 있을까요?</strong>
            <small>숫자와 기록을 함께 보며 돌아보기</small>
          </span>
        </span>
        <ChevronRight />
      </button>
    </section>
  );
}

function TodoRow({
  todo,
  busy,
  onEdit,
  onExecution,
  onComplete,
  onDelete,
}: {
  todo: TodoDto;
  busy: boolean;
  onEdit: (todo: TodoDto) => void;
  onExecution: (todo: TodoDto) => void;
  onComplete: (todo: TodoDto) => void;
  onDelete: (todo: TodoDto) => void;
}) {
  const actual = todo.executionLogs.reduce(
    (sum, log) => sum + log.actualSeconds,
    0,
  );
  const due = dateKey(todo.dueDate);
  const overdue = todo.status !== "COMPLETED" && due !== null && due < today();
  const blocked = todo.executionLogs.some((log) => log.blockedReason?.trim());
  return (
    <article
      className={clsx("todo-row", todo.status === "COMPLETED" && "completed")}
    >
      <button
        disabled={busy}
        className="complete-button"
        onClick={() => onComplete(todo)}
        aria-label={
          todo.status === "COMPLETED"
            ? `${todo.content} 다시 진행 중으로`
            : `${todo.content} 완료로 표시`
        }
      >
        {todo.status === "COMPLETED" ? <Check /> : <Circle />}
      </button>
      <div className="todo-main">
        <div className="todo-title-line">
          <h2>{todo.content}</h2>
          <span className={clsx("priority", todo.priority.toLowerCase())}>
            {priorityLabel(todo.priority)}
          </span>
        </div>
        <div className="todo-meta">
          {due && (
            <span className={clsx(overdue && "critical")}>
              <CalendarDays />
              {overdue ? "지연 · " : ""}
              {due} 마감
            </span>
          )}
          {todo.tags.map((tag) => (
            <span key={tag}>
              <Tag />
              {tag}
            </span>
          ))}
          {blocked && (
            <span className="blocked">
              <TriangleAlert />
              막힌 이유 있음
            </span>
          )}
        </div>
        <div className="time-pair">
          <span className="planned">
            <Clock3 />
            예상{" "}
            <strong>
              {formatDuration(todo.estimatedSeconds).replace(/^\+/, "")}
            </strong>
          </span>
          <span className="actual">
            <Timer />
            실제{" "}
            <strong>
              {todo.executionLogs.length
                ? formatDuration(actual).replace(/^\+/, "")
                : "기록 없음"}
            </strong>
          </span>
          {todo.executionLogs.length > 0 && (
            <span>
              차이{" "}
              <strong>{formatDuration(actual - todo.estimatedSeconds)}</strong>
            </span>
          )}
        </div>
      </div>
      <div className="row-actions">
        <button onClick={() => onExecution(todo)}>
          <Timer />
          실행 기록
        </button>
        <button
          onClick={() => onEdit(todo)}
          aria-label={`${todo.content} 수정`}
        >
          <Pencil />
        </button>
        <button
          onClick={() => onDelete(todo)}
          aria-label={`${todo.content} 삭제`}
        >
          <Trash2 />
        </button>
      </div>
    </article>
  );
}

export function PlanView({
  plan,
  onEdit,
}: {
  plan: PlanDto;
  onEdit: () => void;
}) {
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">계획 v{plan.version}</span>
          <h1>{plan.title}</h1>
          <p>계획을 고쳐도 이전 모습은 조용히 남겨둬요.</p>
        </div>
        <button className="primary-button" onClick={onEdit}>
          <Pencil size={18} />
          계획 수정
        </button>
      </div>
      {plan.transfersIn.length > 0 && (
        <div className="carry-note">
          <Sprout />
          <div>
            <span className="eyebrow">이전 돌아보기에서 가져왔어요</span>
            {plan.transfersIn.map((transfer) => (
              <p key={transfer.id}>{transfer.content}</p>
            ))}
          </div>
        </div>
      )}
      <div className="plan-grid">
        <div className="plan-card accent-mint">
          <span>기간</span>
          <strong>
            {dateKey(plan.startDate)}
            <br />– {dateKey(plan.endDate)}
          </strong>
        </div>
        <div className="plan-card">
          <span>우선순위</span>
          <strong>{priorityLabel(plan.priority)}</strong>
        </div>
        <div className="plan-card">
          <span>계획 예상 시간</span>
          <strong>
            {formatDuration(plan.estimatedSeconds).replace(/^\+/, "")}
          </strong>
          <small>할 일 합계와 별도로 저장해요.</small>
        </div>
        <div className="plan-card wide">
          <span>성공 기준</span>
          <strong>{plan.successCriteria}</strong>
        </div>
      </div>
      <section className="history-section">
        <div className="section-title">
          <History />
          <div>
            <h2>수정 전 계획</h2>
            <p>과거 값은 읽기 전용으로 확인할 수 있어요.</p>
          </div>
        </div>
        {plan.revisions.length ? (
          <div className="revision-list">
            {plan.revisions.map((revision) => (
              <details key={revision.id}>
                <summary>
                  버전 {revision.version} ·{" "}
                  {new Date(revision.createdAt).toLocaleString("ko-KR")}
                </summary>
                <dl>
                  <div>
                    <dt>제목</dt>
                    <dd>{revision.title}</dd>
                  </div>
                  <div>
                    <dt>기간</dt>
                    <dd>
                      {dateKey(revision.startDate)} –{" "}
                      {dateKey(revision.endDate)}
                    </dd>
                  </div>
                  <div>
                    <dt>우선순위</dt>
                    <dd>{priorityLabel(revision.priority)}</dd>
                  </div>
                  <div>
                    <dt>예상</dt>
                    <dd>
                      {formatDuration(revision.estimatedSeconds).replace(
                        /^\+/,
                        "",
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>성공 기준</dt>
                    <dd>{revision.successCriteria}</dd>
                  </div>
                </dl>
              </details>
            ))}
          </div>
        ) : (
          <p className="muted-box">아직 수정 전 버전이 없어요.</p>
        )}
      </section>
    </section>
  );
}

export function ReviewView({
  plan,
  plans,
  metrics,
  metric,
  setMetric,
  busy,
  command,
}: {
  plan: PlanDto;
  plans: PlanDto[];
  metrics: ReturnType<typeof calculateReview>;
  metric: Metric | null;
  setMetric: (metric: Metric | null) => void;
  busy: boolean;
  command: (payload: object, success: string) => Promise<boolean>;
}) {
  const [reflection, setReflection] = useState(plan.review?.reflection ?? "");
  const [improvement, setImprovement] = useState(
    plan.review?.improvement ?? "",
  );
  const [targetPlanId, setTargetPlanId] = useState(
    plan.review?.transfer?.targetPlanId ?? "",
  );
  const active = plan.todos.filter((todo) => !todo.deletedAt);
  const metricTodos =
    metric === "completed"
      ? active.filter((t) => t.status === "COMPLETED")
      : metric === "overdue"
        ? active.filter(
            (t) =>
              t.status !== "COMPLETED" &&
              Boolean(dateKey(t.dueDate) && dateKey(t.dueDate)! < today()),
          )
        : metric === "blocked"
          ? active.filter((t) =>
              t.executionLogs.some((log) => log.blockedReason?.trim()),
            )
          : active;
  const cards: Array<[Metric, string, number, string]> = [
    ["planned", "계획 수", metrics.plannedCount, "등록한 할 일"],
    ["completed", "완료", metrics.completedCount, "현재 완료 상태"],
    ["overdue", "지연", metrics.overdueCount, "서울 기준 오늘 이전"],
    ["blocked", "막힘", metrics.blockedCount, "이유가 있는 할 일"],
  ];
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">이 계획의 현재 자료 기준</span>
          <h1>돌아보기</h1>
          <p>숫자를 누르면 그 숫자가 나온 기록을 볼 수 있어요.</p>
        </div>
      </div>
      <div className="metric-grid">
        {cards.map(([key, label, value, note]) => (
          <button
            key={key}
            className={clsx("metric-card", metric === key && "selected")}
            onClick={() => setMetric(metric === key ? null : key)}
          >
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note} · 기록 보기</small>
          </button>
        ))}
      </div>
      <div className="time-summary">
        <button onClick={() => setMetric("estimated")}>
          <span>예상 시간</span>
          <strong>
            {formatDuration(metrics.estimatedSeconds).replace(/^\+/, "")}
          </strong>
          <small>할 일 예상의 합</small>
        </button>
        <button onClick={() => setMetric("actual")}>
          <span>실제 시간</span>
          <strong>
            {formatDuration(metrics.actualSeconds).replace(/^\+/, "")}
          </strong>
          <small>실행 기록의 합</small>
        </button>
        <button onClick={() => setMetric("difference")}>
          <span>차이</span>
          <strong>{formatDuration(metrics.differenceSeconds)}</strong>
          <small>실제 − 예상</small>
        </button>
      </div>
      {metric && (
        <section className="evidence-panel">
          <div className="section-title">
            <Archive />
            <div>
              <h2>‘{metricLabel(metric)}’의 근거 기록</h2>
              <p>
                {metric === "difference"
                  ? "예상과 실제를 함께 대조합니다."
                  : `${metricTodos.length}개의 할 일을 확인합니다.`}
              </p>
            </div>
            <button onClick={() => setMetric(null)} aria-label="근거 기록 닫기">
              <X />
            </button>
          </div>
          {metricTodos.length ? (
            metricTodos.map((todo) => (
              <div className="evidence-row" key={todo.id}>
                <div>
                  <strong>{todo.content}</strong>
                  <span>
                    {todo.status === "COMPLETED" ? "완료" : "진행 중"} · 예상{" "}
                    {formatDuration(todo.estimatedSeconds).replace(/^\+/, "")}
                  </span>
                </div>
                <div>
                  {todo.executionLogs.map((log) => (
                    <span key={log.id}>
                      실제{" "}
                      {formatDuration(log.actualSeconds).replace(/^\+/, "")}
                      {log.blockedReason ? ` · ${log.blockedReason}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="muted-box">이 숫자에 해당하는 기록이 없어요.</p>
          )}
        </section>
      )}
      <form
        className="reflection-card"
        onSubmit={async (event) => {
          event.preventDefault();
          await command(
            {
              action: "saveReview",
              planId: plan.id,
              data: { reflection, improvement },
            },
            "돌아보기를 저장했어요.",
          );
        }}
      >
        <span className="eyebrow">내가 직접 적는 기록</span>
        <h2>예상과 달랐던 점이 있었나요?</h2>
        <label>
          돌아보기
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="실제로 겪은 일을 적어보세요."
            rows={4}
          />
        </label>
        <label>
          다음에 고칠 점 한 가지
          <textarea
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            placeholder="다음 계획에서 바꿔볼 한 가지"
            rows={2}
          />
        </label>
        <button disabled={busy} className="primary-button">
          돌아보기 저장
        </button>
      </form>
      {plan.review && (
        <div className="transfer-card">
          <div>
            <span className="eyebrow">다음 계획으로</span>
            <h2>고칠 점을 이어서 써볼까요?</h2>
            <p>
              {plan.review.improvement ||
                "먼저 위에서 고칠 점을 저장해 주세요."}
            </p>
          </div>
          <div className="transfer-controls">
            <select
              value={targetPlanId}
              onChange={(e) => setTargetPlanId(e.target.value)}
              aria-label="개선점을 받을 다음 계획"
            >
              <option value="">다음 계획 선택</option>
              {plans
                .filter((p) => p.id !== plan.id)
                .map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.title}
                  </option>
                ))}
            </select>
            <button
              className="secondary-button"
              disabled={busy || !targetPlanId || !plan.review.improvement}
              onClick={() =>
                command(
                  {
                    action: "transferImprovement",
                    reviewId: plan.review!.id,
                    targetPlanId,
                  },
                  "고칠 점을 다음 계획으로 옮겼어요.",
                )
              }
            >
              <Sprout />
              전달하기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function metricLabel(metric: Metric) {
  return {
    planned: "계획 수",
    completed: "완료",
    overdue: "지연",
    blocked: "막힘",
    estimated: "예상 시간",
    actual: "실제 시간",
    difference: "차이",
  }[metric];
}
