"use client";

import { useEffect, useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { BigButton, Field, LineButton, Screen, Status } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import {
  safeNextPath,
  signInWith,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/client/supabase-browser";

type Mode = "login" | "signup";

function readNext(): string {
  if (typeof window === "undefined") return "/board";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"), "/board");
}

export default function LoginPage() {
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/board");

  useEffect(() => {
    setNext(readNext());
  }, []);

  useEffect(() => {
    if (!ready || !user) return;
    window.location.replace(readNext());
  }, [ready, user]);

  const lead = mode === "signup"
    ? "이메일과 비밀번호로 새 계정을 만들어요."
    : next === "/care" || next === "/link"
      ? "가족 연동을 하려면 로그인해 주세요."
      : "이메일로 로그인하거나 아래 소셜 로그인을 눌러 주세요.";

  async function submitEmail() {
    if (busy || user) return;
    setBusy(true);
    setMessage("");

    if (mode === "signup") {
      const result = await signUpWithEmail(email, password, passwordConfirm);
      if (!result.ok) {
        setMessage(result.message);
        setBusy(false);
        return;
      }
      if (result.needsConfirm) {
        setMessage("가입 확인 메일을 보냈어요. 메일함을 확인한 뒤 로그인해 주세요.");
        setMode("login");
        setPassword("");
        setPasswordConfirm("");
        setBusy(false);
        return;
      }
      // 세션이 생기면 useAuth 가 next 로 이동한다.
      return;
    }

    const failure = await signInWithEmail(email, password);
    setMessage(failure);
    if (failure) setBusy(false);
  }

  async function login(provider: Provider) {
    if (busy || user) return;
    setBusy(true);
    setMessage("");
    const failure = await signInWith(provider, readNext());
    setMessage(failure);
    if (failure) setBusy(false);
  }

  function switchMode(nextMode: Mode) {
    if (busy) return;
    setMode(nextMode);
    setMessage("");
    setPasswordConfirm("");
  }

  return (
    <Screen title={mode === "signup" ? "회원가입" : "로그인"} lead={lead} narrow>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submitEmail();
        }}
      >
        <Field
          id="auth-email"
          label="이메일"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          placeholder="예: name@email.com"
          disabled={busy}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          id="auth-password"
          label="비밀번호"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          placeholder="8자 이상"
          disabled={busy}
          onChange={(event) => setPassword(event.target.value)}
        />
        {mode === "signup" ? (
          <Field
            id="auth-password-confirm"
            label="비밀번호 확인"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            placeholder="비밀번호를 한 번 더"
            disabled={busy}
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
        ) : null}
        <BigButton type="submit" disabled={busy}>
          {mode === "signup" ? "회원가입" : "이메일로 로그인"}
        </BigButton>
      </form>

      <p className="auth-switch">
        {mode === "signup" ? (
          <>
            이미 계정이 있나요?{" "}
            <button type="button" className="auth-switch-btn" disabled={busy} onClick={() => switchMode("login")}>
              로그인
            </button>
          </>
        ) : (
          <>
            아직 계정이 없나요?{" "}
            <button type="button" className="auth-switch-btn" disabled={busy} onClick={() => switchMode("signup")}>
              회원가입
            </button>
          </>
        )}
      </p>

      <div className="auth-divider" role="separator" aria-label="또는">
        <span>또는</span>
      </div>

      <BigButton tone="kakao" disabled={busy} onClick={() => void login("kakao")}>카카오로 로그인</BigButton>
      <BigButton tone="naver" disabled={busy} onClick={() => void login("naver" as Provider)}>네이버로 로그인</BigButton>
      <BigButton tone="google" disabled={busy} onClick={() => void login("google")}>구글로 로그인</BigButton>

      {message ? <Status>{message}</Status> : null}
      <LineButton href="/">홈으로</LineButton>
    </Screen>
  );
}
