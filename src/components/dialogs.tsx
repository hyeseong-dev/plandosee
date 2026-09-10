"use client";

import { useState, type ReactNode } from "react";
import { Clock3, X } from "lucide-react";
import {
  dateKey,
  formatDuration,
  seoulDateKey,
  type PlanDto,
  type Priority,
  type TodoDto,
} from "@/lib/domain";

const addDays = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return seoulDateKey(value);
};
const toLocalInput = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

function DialogShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-title">
          <div>
            <span className="eyebrow">작게 적고, 오래 남겨요</span>
            <h2 id="dialog-title">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="닫기">
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function PlanDialog({
  plan,
  busy,
  onClose,
  onSave,
}: {
  plan: PlanDto | null;
  busy: boolean;
  onClose: () => void;
  onSave: (
    payload: {
      title: string;
      startDate: string;
      endDate: string;
      priority: Priority;
      successCriteria: string;
      estimatedSeconds: number;
    },
    id?: string,
  ) => void;
}) {
  const [title, setTitle] = useState(plan?.title ?? "");
  const [startDate, setStartDate] = useState(
    dateKey(plan?.startDate ?? null) ?? seoulDateKey(),
  );
  const [endDate, setEndDate] = useState(
    dateKey(plan?.endDate ?? null) ?? addDays(6),
  );
  const [priority, setPriority] = useState<Priority>(
    plan?.priority ?? "MEDIUM",
  );
  const [success, setSuccess] = useState(plan?.successCriteria ?? "");
  const [minutes, setMinutes] = useState(
    String((plan?.estimatedSeconds ?? 0) / 60),
  );
  return (
    <DialogShell title={plan ? "계획 수정" : "새 계획"} onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(
            {
              title,
              startDate,
              endDate,
              priority,
              successCriteria: success,
              estimatedSeconds: Math.round(Number(minutes) * 60),
            },
            plan?.id,
          );
        }}
      >
        <label className="wide">
          계획 이름
          <input
            autoFocus
            required
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          시작일
          <input
            required
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          종료일
          <input
            required
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <label>
          우선순위
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
          >
            <option value="HIGH">높음</option>
            <option value="MEDIUM">보통</option>
            <option value="LOW">낮음</option>
          </select>
        </label>
        <label>
          계획 예상 시간 (분)
          <input
            required
            min="0"
              step="any"
            type="number"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          />
        </label>
        <label className="wide">
          성공 기준
          <textarea
            required
            maxLength={1000}
            value={success}
            onChange={(event) => setSuccess(event.target.value)}
            rows={3}
          />
        </label>
        <div className="form-actions wide">
          <button type="button" className="ghost-button" onClick={onClose}>
            취소
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? "저장 중…" : "계획 저장"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

export function TodoDialog({
  todo,
  busy,
  onClose,
  onSave,
}: {
  todo: TodoDto | null;
  busy: boolean;
  onClose: () => void;
  onSave: (
    payload: {
      content: string;
      dueDate: string | null;
      priority: Priority;
      tags: string[];
      estimatedSeconds: number;
    },
    id?: string,
  ) => void;
}) {
  const [content, setContent] = useState(todo?.content ?? "");
  const [dueDate, setDueDate] = useState(dateKey(todo?.dueDate ?? null) ?? "");
  const [priority, setPriority] = useState<Priority>(
    todo?.priority ?? "MEDIUM",
  );
  const [tags, setTags] = useState(todo?.tags.join(", ") ?? "");
  const [minutes, setMinutes] = useState(
    String((todo?.estimatedSeconds ?? 0) / 60),
  );
  return (
    <DialogShell title={todo ? "할 일 수정" : "할 일 추가"} onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(
            {
              content,
              dueDate: dueDate || null,
              priority,
              tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
              estimatedSeconds: Math.round(Number(minutes) * 60),
            },
            todo?.id,
          );
        }}
      >
        <label className="wide">
          할 일 내용
          <input
            autoFocus
            required
            maxLength={500}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>
        <label>
          마감일
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
        <label>
          우선순위
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
          >
            <option value="HIGH">높음</option>
            <option value="MEDIUM">보통</option>
            <option value="LOW">낮음</option>
          </select>
        </label>
        <label>
          예상 시간 (분)
          <input
            required
            min="0"
              step="any"
            type="number"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          />
        </label>
        <label>
          태그 (쉼표로 구분)
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="기획, 집중"
          />
        </label>
        <div className="form-actions wide">
          <button type="button" className="ghost-button" onClick={onClose}>
            취소
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? "저장 중…" : "할 일 저장"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

export function ExecutionDialog({
  todo,
  busy,
  onClose,
  onSave,
}: {
  todo: TodoDto;
  busy: boolean;
  onClose: () => void;
  onSave: (payload: {
    startedAt: string;
    endedAt: string;
    blockedReason: string | null;
  }) => void;
}) {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 60 * 1000);
  const [startedAt, setStartedAt] = useState(toLocalInput(start));
  const [endedAt, setEndedAt] = useState(toLocalInput(end));
  const [blockedReason, setBlockedReason] = useState("");
  const seconds = Math.max(
    0,
    Math.floor(
      (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
    ),
  );
  return (
    <DialogShell title="실제로 한 일 기록" onClose={onClose}>
      <p className="dialog-context">{todo.content}</p>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            startedAt: new Date(startedAt).toISOString(),
            endedAt: new Date(endedAt).toISOString(),
            blockedReason: blockedReason.trim() || null,
          });
        }}
      >
        <label>
          시작 시각
          <input
            required
            type="datetime-local"
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
          />
        </label>
        <label>
          끝난 시각
          <input
            required
            type="datetime-local"
            value={endedAt}
            onChange={(event) => setEndedAt(event.target.value)}
          />
        </label>
        <div className="duration-preview wide">
          <Clock3 />
          <span>실제로 걸린 시간</span>
          <strong>{formatDuration(seconds).replace(/^\+/, "")}</strong>
        </div>
        <label className="wide">
          막혔던 이유 (선택)
          <textarea
            value={blockedReason}
            maxLength={1000}
            onChange={(event) => setBlockedReason(event.target.value)}
            placeholder="없다면 비워두어도 괜찮아요."
            rows={3}
          />
        </label>
        <div className="form-actions wide">
          <button type="button" className="ghost-button" onClick={onClose}>
            취소
          </button>
          <button
            className="primary-button"
            disabled={busy || new Date(endedAt) < new Date(startedAt)}
          >
            {busy ? "저장 중…" : "실행 기록 저장"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
