"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { BigButton, Field, LineButton, Screen, Status } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { formatPhoneDisplay, passwordIssues } from "@/lib/domain/auth-form";
import {
  resendSignupEmail,
  safeNextPath,
  sendPasswordReset,
  sendPhoneOtp,
  signInWith,
  signInWithEmail,
  signUpWithEmail,
  verifyEmailOtp,
  verifyPhoneOtp,
} from "@/lib/client/supabase-browser";

type Mode = "login" | "signup" | "emailConfirm" | "phoneVerify" | "reset";

function readNext(): string {
  if (typeof window === "undefined") return "/board";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"), "/board");
}

export default function LoginPage() {
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/board");

  const passwordHints = useMemo(() => passwordIssues(password, email), [password, email]);

  useEffect(() => {
    setNext(readNext());
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") setMode("signup");
    if (params.get("confirmed") === "1") setMessage("이메일 인증이 끝났어요. 로그인해 주세요.");
  }, []);

  useEffect(() => {
    if (!ready || !user) return;
    if (mode === "phoneVerify" || mode === "emailConfirm") return;
    window.location.replace(readNext());
  }, [ready, user, mode]);

  const title =
    mode === "signup" ? "회원가입"
      : mode === "emailConfirm" ? "이메일 인증"
        : mode === "phoneVerify" ? "휴대폰 인증"
          : mode === "reset" ? "비밀번호 찾기"
            : "로그인";

  const lead =
    mode === "signup" ? "이름·이메일·휴대폰과 안전한 비밀번호로 가입해요."
      : mode === "emailConfirm" ? "메일함의 링크를 누르거나, 받은 인증 번호를 입력해 주세요."
        : mode === "phoneVerify" ? "휴대폰으로 받은 인증 번호를 입력하면 가입이 끝나요."
          : mode === "reset" ? "가입한 이메일로 재설정 안내를 보내 드려요."
            : next === "/care" || next === "/link"
              ? "가족 연동을 하려면 로그인해 주세요."
              : "이메일로 로그인하거나 아래 소셜 로그인을 눌러 주세요.";

  async function submitLogin() {
    if (busy || user) return;
    setBusy(true);
    setMessage("");
    const failure = await signInWithEmail(email, password);
    if (failure) {
      setMessage(failure);
      setBusy(false);
      return;
    }
  }

  async function submitSignup() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const result = await signUpWithEmail(
      { name, email, phone, password, passwordConfirm, agreeTerms, agreePrivacy },
      readNext(),
    );
    if (!result.ok) {
      setMessage(result.message);
      setBusy(false);
      return;
    }
    setPassword("");
    setPasswordConfirm("");
    setOtp("");
    setMode("emailConfirm");
    setMessage(
      result.needsEmailConfirm
        ? "가입 확인 메일을 보냈어요. 메일함(스팸함)을 확인해 주세요."
        : "가입됐어요. 이어서 휴대폰 인증을 진행해 주세요.",
    );
    setBusy(false);
    if (!result.needsEmailConfirm) setMode("phoneVerify");
  }

  async function submitEmailOtp() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const failure = await verifyEmailOtp(email, otp);
    if (failure) {
      setMessage(failure);
      setBusy(false);
      return;
    }
    setOtp("");
    setMode("phoneVerify");
    setMessage("이메일 인증이 끝났어요. 휴대폰 인증 번호를 받아 주세요.");
    setBusy(false);
  }

  async function requestPhoneOtp() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const failure = await sendPhoneOtp(phone);
    setMessage(failure || "인증 번호를 문자로 보냈어요.");
    setBusy(false);
  }

  async function submitPhoneOtp() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const failure = await verifyPhoneOtp(phone, otp);
    if (failure) {
      setMessage(failure);
      setBusy(false);
      return;
    }
    window.location.replace(readNext());
  }

  async function submitReset() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const failure = await sendPasswordReset(email);
    if (failure) {
      setMessage(failure);
      setBusy(false);
      return;
    }
    setMessage("재설정 안내를 보냈어요. 메일함을 확인해 주세요.");
    setBusy(false);
  }

  async function resendEmail() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const failure = await resendSignupEmail(email);
    setMessage(failure || "확인 메일을 다시 보냈어요.");
    setBusy(false);
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
    setOtp("");
    if (nextMode !== "signup") {
      setPasswordConfirm("");
      setAgreeTerms(false);
      setAgreePrivacy(false);
    }
  }

  return (
    <Screen title={title} lead={lead} narrow>
      {mode === "login" ? (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitLogin();
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
            autoComplete="current-password"
            value={password}
            placeholder="비밀번호"
            disabled={busy}
            onChange={(event) => setPassword(event.target.value)}
          />
          <BigButton type="submit" disabled={busy}>이메일로 로그인</BigButton>
          <p className="auth-switch">
            <button type="button" className="auth-switch-btn" disabled={busy} onClick={() => switchMode("reset")}>
              비밀번호를 잊으셨나요?
            </button>
          </p>
        </form>
      ) : null}

      {mode === "signup" ? (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitSignup();
          }}
        >
          <Field
            id="auth-name"
            label="이름"
            autoComplete="name"
            value={name}
            placeholder="홍길동"
            maxLength={40}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
          <Field
            id="auth-email-signup"
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
            id="auth-phone"
            label="휴대폰 번호"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            value={phone}
            placeholder="010-1234-5678"
            disabled={busy}
            onChange={(event) => setPhone(formatPhoneDisplay(event.target.value))}
          />
          <Field
            id="auth-password-signup"
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            value={password}
            placeholder="영문·숫자 포함 8자 이상"
            disabled={busy}
            onChange={(event) => setPassword(event.target.value)}
          />
          <ul className="auth-rules" aria-live="polite">
            <li className={password && !passwordHints.includes("8자 이상") ? "ok" : undefined}>8자 이상</li>
            <li className={password && !passwordHints.includes("영문 포함") ? "ok" : undefined}>영문 포함</li>
            <li className={password && !passwordHints.includes("숫자 포함") ? "ok" : undefined}>숫자 포함</li>
            <li className={password && !passwordHints.some((item) => item.includes("이메일")) ? "ok" : undefined}>
              이메일 아이디와 다르게
            </li>
          </ul>
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
          <div className="auth-agreements">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={agreeTerms}
                disabled={busy}
                onChange={(event) => setAgreeTerms(event.target.checked)}
              />
              <span>
                <Link href="/terms" target="_blank">이용약관</Link>에 동의합니다 (필수)
              </span>
            </label>
            <label className="auth-check">
              <input
                type="checkbox"
                checked={agreePrivacy}
                disabled={busy}
                onChange={(event) => setAgreePrivacy(event.target.checked)}
              />
              <span>
                <Link href="/privacy" target="_blank">개인정보 처리방침</Link>에 동의합니다 (필수)
              </span>
            </label>
          </div>
          <BigButton type="submit" disabled={busy}>가입하고 인증하기</BigButton>
        </form>
      ) : null}

      {mode === "emailConfirm" ? (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitEmailOtp();
          }}
        >
          <Status>
            <strong>{email}</strong> 으로 확인 메일을 보냈어요. 링크를 누르거나 인증 번호를 입력해 주세요.
          </Status>
          <Field
            id="auth-email-otp"
            label="이메일 인증 번호"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            placeholder="6~8자리 숫자"
            disabled={busy}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
          />
          <BigButton type="submit" disabled={busy || otp.length < 6}>이메일 인증 완료</BigButton>
          <LineButton disabled={busy} onClick={() => void resendEmail()}>확인 메일 다시 받기</LineButton>
          <LineButton disabled={busy} onClick={() => switchMode("phoneVerify")}>휴대폰 인증으로 이어가기</LineButton>
        </form>
      ) : null}

      {mode === "phoneVerify" ? (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitPhoneOtp();
          }}
        >
          <Field
            id="auth-phone-verify"
            label="휴대폰 번호"
            type="tel"
            inputMode="numeric"
            value={phone}
            placeholder="010-1234-5678"
            disabled={busy}
            onChange={(event) => setPhone(formatPhoneDisplay(event.target.value))}
          />
          <LineButton disabled={busy} onClick={() => void requestPhoneOtp()}>인증 번호 받기</LineButton>
          <Field
            id="auth-phone-otp"
            label="문자 인증 번호"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            placeholder="6~8자리 숫자"
            disabled={busy}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
          />
          <BigButton type="submit" disabled={busy || otp.length < 6}>휴대폰 인증 완료</BigButton>
          <p className="auth-note">문자 인증이 안 되면 이메일 인증만으로도 로그인할 수 있어요.</p>
          <LineButton
            disabled={busy}
            onClick={() => {
              if (user) window.location.replace(readNext());
              else switchMode("login");
            }}
          >
            나중에 하고 로그인하기
          </LineButton>
        </form>
      ) : null}

      {mode === "reset" ? (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitReset();
          }}
        >
          <Field
            id="auth-email-reset"
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            placeholder="가입한 이메일"
            disabled={busy}
            onChange={(event) => setEmail(event.target.value)}
          />
          <BigButton type="submit" disabled={busy}>재설정 메일 받기</BigButton>
        </form>
      ) : null}

      {mode === "login" || mode === "signup" ? (
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
      ) : (
        <p className="auth-switch">
          <button type="button" className="auth-switch-btn" disabled={busy} onClick={() => switchMode("login")}>
            로그인으로 돌아가기
          </button>
        </p>
      )}

      {mode === "login" ? (
        <>
          <div className="auth-divider" role="separator" aria-label="또는">
            <span>또는</span>
          </div>
          <BigButton tone="kakao" disabled={busy} onClick={() => void login("kakao")}>카카오로 로그인</BigButton>
          <BigButton tone="naver" disabled={busy} onClick={() => void login("naver" as Provider)}>네이버로 로그인</BigButton>
          <BigButton tone="google" disabled={busy} onClick={() => void login("google")}>구글로 로그인</BigButton>
        </>
      ) : null}

      {message ? <Status>{message}</Status> : null}
      <LineButton href="/">홈으로</LineButton>
    </Screen>
  );
}
