"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Leaf, LockKeyhole, Sprout } from "lucide-react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "요청을 처리하지 못했어요.");
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "요청을 처리하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="auth-brand"><span className="brand-mark"><Sprout size={22} /></span>plandosee</div>
        <span className="eyebrow">Plan · Do · See</span>
        <h1>기록은 잠그고,<br />성장은 이어가요.</h1>
        <p>계획과 실제를 나란히 보고, 다섯 번의 관찰을 다음 계획으로 연결하는 나만의 작은 정원입니다.</p>
        <div className="auth-promise">
          <Leaf size={20} />
          <div><strong>이제 내 기록은 나에게만</strong><span>로그인한 계정의 계획과 실행 기록만 불러옵니다.</span></div>
        </div>
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-icon"><LockKeyhole /></div>
        <span className="eyebrow">나의 정원 입구</span>
        <h2 id="auth-title">{mode === "login" ? "다시 만나서 반가워요" : "새 계정을 심어 볼까요?"}</h2>
        <p>{mode === "login" ? "이메일과 비밀번호로 내 기록을 열어 보세요." : "첫 계정이라면 기존 PlanDoSee 자료도 안전하게 이어받아요."}</p>
        <div className="auth-tabs" role="tablist" aria-label="인증 방식">
          <button role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setError(""); }}>로그인</button>
          <button role="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setError(""); }}>가입하기</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && (
            <label>이름
              <input name="displayName" autoComplete="name" maxLength={50} required placeholder="기록에 표시할 이름" />
            </label>
          )}
          <label>이메일
            <input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="name@example.com" />
          </label>
          <label>비밀번호
            <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "signup" ? 10 : 1} maxLength={128} required placeholder={mode === "signup" ? "영문자·숫자를 포함해 10자 이상" : "비밀번호"} />
          </label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="primary-button auth-submit" disabled={busy}>
            <KeyRound size={18} />{busy ? "확인하고 있어요…" : mode === "login" ? "내 기록 열기" : "계정 만들기"}
          </button>
        </form>
        <small className="session-note">로그인 세션은 7일 뒤 만료되며, 로그아웃하거나 비밀번호를 바꾸면 이전 세션은 폐기됩니다.</small>
      </section>
    </main>
  );
}
