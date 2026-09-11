"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BarChart3, CalendarCheck, Leaf, Sparkles } from "lucide-react";

type Entry = { id: string; date: string; value: number; note: string };
type Study = {
  question: string; metricName: string; unit: string; missingRule: string;
  duplicateRule: string; outlierRule: string; roundingRule: string; weekStartsOn: string;
  entries: Entry[];
  ruleChange: null | { changedAt: string; reason: string; beforeRule: string; afterRule: string; sourceEntryIds: string[] };
};

async function json(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "요청을 처리하지 못했어요.");
  return data;
}

export function DiaryView() {
  const [study, setStudy] = useState<Study | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/diary", { cache: "no-store" }).then(json).then((data) => setStudy(data.study)).catch((reason) => setError(reason.message));
  }, []);
  const total = useMemo(() => study?.entries.reduce((sum, entry) => sum + entry.value, 0) ?? 0, [study]);
  const roundedAverage = study?.entries.length ? Math.round((total / study.entries.length) * 10) / 10 : 0;

  async function command(payload: object, form?: HTMLFormElement) {
    setBusy(true); setError("");
    try {
      const data = await json(await fetch("/api/diary", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      }));
      setStudy(data.study); form?.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "저장하지 못했어요.");
    } finally { setBusy(false); }
  }

  function createStudy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    command({ action: "createStudy", data }, form);
  }
  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    command({ action: "saveEntry", data: { ...data, value: Number(data.value) } }, form);
  }
  function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    command({ action: "saveRuleChange", data }, form);
  }

  if (study === undefined) return <section className="page-section"><div className="seed-loader" /><p>5일 기록을 불러오고 있어요.</p></section>;
  return (
    <section className="page-section diary-page">
      <div className="page-heading">
        <div><span className="eyebrow">Five-day diary</span><h1>다섯 번 관찰하는 정원</h1><p>같은 질문과 같은 단위로 실제 5일을 기록해 계획의 변화를 살펴봐요.</p></div>
        {study && <div className="day-progress"><strong>{study.entries.length}/5</strong><span>실제 날짜</span></div>}
      </div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {!study ? (
        <form className="study-setup" onSubmit={createStudy}>
          <div className="section-title"><Sparkles /><div><h2>1일차 전에 기준 고정하기</h2><p>질문·지표·단위와 계산 규칙은 다섯 날 모두에 적용됩니다.</p></div></div>
          <label className="wide">답하려는 질문<input name="question" required minLength={10} placeholder="예: 오전에 세운 계획이 하루 집중 시간에 어떤 영향을 주는가?" /></label>
          <label>관찰 지표<input name="metricName" required placeholder="집중해서 일한 시간" /></label>
          <label>단위<input name="unit" required placeholder="분" /></label>
          <label>값이 빠졌을 때<input name="missingRule" required defaultValue="합계와 평균에서 제외하고 빠진 날로 표시한다." /></label>
          <label>값이 중복될 때<input name="duplicateRule" required defaultValue="같은 날짜의 마지막 저장값으로 교체한다." /></label>
          <label>값이 유난히 튈 때<input name="outlierRule" required defaultValue="제외하지 않고 표시를 붙여 실제 값으로 포함한다." /></label>
          <label>반올림<input name="roundingRule" required defaultValue="평균만 소수점 첫째 자리에서 반올림한다." /></label>
          <div className="rule-chip"><CalendarCheck />주 시작 요일은 월요일</div>
          <button className="primary-button" disabled={busy}>이 기준으로 시작하기</button>
        </form>
      ) : (
        <>
          <article className="study-question">
            <Leaf /><div><span>다섯 날 동안 답할 질문</span><h2>{study.question}</h2><p>{study.metricName} · {study.unit} · 주 시작 월요일</p></div>
          </article>
          <div className="diary-summary">
            <div><span>손으로 더한 합계</span><strong>{total.toLocaleString()} {study.unit}</strong></div>
            <div><span>기록일 평균</span><strong>{roundedAverage.toLocaleString()} {study.unit}</strong></div>
            <div><span>진행</span><strong>{study.entries.length === 5 ? "관찰 완료" : `${5 - study.entries.length}일 남음`}</strong></div>
          </div>
          <div className="diary-layout">
            <div className="entry-timeline">
              {study.entries.map((entry, index) => (
                <article className="diary-entry" key={entry.id}>
                  <span className="day-seed">{index + 1}</span>
                  <div><small>{entry.date.slice(0, 10)} · Asia/Seoul</small><h3>{entry.value.toLocaleString()} {study.unit}</h3><p>{entry.note || "메모 없음"}</p></div>
                </article>
              ))}
              {study.ruleChange && (
                <article className="rule-change">
                  <BarChart3 /><div><small>{new Date(study.ruleChange.changedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</small><h3>2일차 뒤 계획 규칙을 바꿨어요</h3><p>{study.ruleChange.beforeRule} → {study.ruleChange.afterRule}</p><strong>{study.ruleChange.reason}</strong></div>
                </article>
              )}
              {study.entries.length < 5 && (
                <form className="entry-form" onSubmit={saveEntry}>
                  <h2>{study.entries.length + 1}일차 실제 기록</h2>
                  <label>실제 날짜<input name="date" type="date" required /></label>
                  <label>{study.metricName} ({study.unit})<input name="value" type="number" min="0" step="0.1" required /></label>
                  <label className="wide">관찰 메모<textarea name="note" rows={3} placeholder="그날 실제로 관찰한 맥락을 적어 주세요." /></label>
                  <button className="primary-button" disabled={busy}>기록 저장</button>
                </form>
              )}
            </div>
            <aside className="calculation-rules">
              <h2>계산 약속</h2>
              <dl><div><dt>빠진 값</dt><dd>{study.missingRule}</dd></div><div><dt>중복</dt><dd>{study.duplicateRule}</dd></div><div><dt>튀는 값</dt><dd>{study.outlierRule}</dd></div><div><dt>반올림</dt><dd>{study.roundingRule}</dd></div></dl>
              {study.entries.length === 2 && !study.ruleChange && (
                <form className="rule-form" onSubmit={saveRule}>
                  <h3>3일차 전에 규칙 바꾸기</h3>
                  <label>변경 전 규칙<input name="beforeRule" required placeholder="예: 오전에 할 일 5개를 정한다" /></label>
                  <label>변경 후 규칙<input name="afterRule" required placeholder="예: 가장 중요한 3개만 정한다" /></label>
                  <label>바꾼 이유<textarea name="reason" required rows={3} /></label>
                  <button className="secondary-button" disabled={busy}>변경 시각 남기기</button>
                </form>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
