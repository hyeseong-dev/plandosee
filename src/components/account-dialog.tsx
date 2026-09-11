"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

async function read(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "요청을 처리하지 못했어요.");
  return data;
}

export function AccountDialog({ user, onClose }: {
  user: { email: string; displayName: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = event.currentTarget;
    try {
      await read(await fetch("/api/auth/password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      }));
      form.reset(); setMessage("비밀번호를 바꾸고 이전 세션을 모두 폐기했어요.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "바꾸지 못했어요."); }
    finally { setBusy(false); }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("계정과 계획·할 일·실행·5일 기록이 모두 삭제됩니다. 계속할까요?")) return;
    setBusy(true); setError("");
    try {
      await read(await fetch("/api/auth/account", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      }));
      router.replace("/");
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "지우지 못했어요."); setBusy(false); }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dialog account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <div className="dialog-title"><div><span className="eyebrow">Account & security</span><h2 id="account-title">내 계정</h2></div><button onClick={onClose} aria-label="계정 창 닫기"><X /></button></div>
      <div className="account-identity"><strong>{user.displayName}</strong><span>{user.email}</span></div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {message && <div className="account-success" role="status">{message}</div>}
      <form className="account-form" onSubmit={changePassword}>
        <h3><KeyRound />비밀번호 바꾸기</h3>
        <p>변경하면 기존에 발급된 모든 세션이 즉시 폐기됩니다.</p>
        <label>현재 비밀번호<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
        <label>새 비밀번호<input name="newPassword" type="password" autoComplete="new-password" minLength={10} required placeholder="영문자·숫자를 포함해 10자 이상" /></label>
        <button className="secondary-button" disabled={busy}>새 비밀번호 저장</button>
      </form>
      <form className="danger-zone" onSubmit={deleteAccount}>
        <h3><Trash2 />계정과 내 자료 지우기</h3>
        <p>계정을 지우면 계획, 할 일, 실행 기록, 돌아보기와 5일 기록이 함께 영구 삭제됩니다.</p>
        <label>확인을 위해 비밀번호 입력<input name="password" type="password" autoComplete="current-password" required /></label>
        <button disabled={busy}>계정 삭제</button>
      </form>
    </section>
  </div>;
}
