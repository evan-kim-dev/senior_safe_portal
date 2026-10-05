"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { BigButton, Field, LineButton, Screen, Status } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { formatPhoneDisplay, passwordIssues } from "@/lib/domain/auth-form";
import {
  EMAIL_NOT_CONFIRMED,
  isPhoneConfirmed,
  resendSignupEmail,
  safeNextPath,
  sendPasswordReset,
  sendPhoneOtp,
  signInWith,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  verifyEmailOtp,
  verifyPhoneOtp,
} from "@/lib/client/supabase-browser";

type Mode = "login" | "signup" | "emailConfirm" | "phoneConfirm" | "reset" | "findId";

/** 호스팅 메일 한도가 시간당 2건이라 재발송을 아끼도록 길게 둔다. */
const EMAIL_RESEND_COOLDOWN_SEC = 180;
const PHONE_RESEND_COOLDOWN_SEC = 60;
const RATE_LIMIT_COOLDOWN_SEC = 3600;

function formatCooldown(sec: number): string {
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  }
  if (sec >= 60) {
    const m = Math.ceil(sec / 60);
    return `${m}분`;
  }
  return `${sec}초`;
}

function readNext(): string {
  if (typeof window === "undefined") return "/board";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"), "/board");
}

export default function LoginPage() {
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [next, setNext] = useState("/board");

  const passwordHints = useMemo(() => passwordIssues(password), [password]);
  const canResend = !busy && resendIn <= 0;

  useEffect(() => {
    setNext(readNext());
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") setMode("signup");
    if (params.get("confirmed") === "1") setMessage("이메일 확인이 끝났어요. 로그인해 주세요.");
    if (params.get("mode") === "confirm") {
      setMode("emailConfirm");
      try {
        const pending = sessionStorage.getItem("ssp.pendingSignupEmail");
        if (pending) setEmail(pending);
      } catch {
        // ignore
      }
    }
    if (params.get("mode") === "phone") {
      setMode("phoneConfirm");
      try {
        const pendingPhone = sessionStorage.getItem("ssp.pendingSignupPhone");
        if (pendingPhone) setPhone(formatPhoneDisplay(pendingPhone));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!ready || !user) return;
    if (mode === "phoneConfirm" && !isPhoneConfirmed(user)) return;
    try {
      sessionStorage.removeItem("ssp.pendingSignupEmail");
      sessionStorage.removeItem("ssp.pendingSignupPhone");
    } catch {
      // ignore
    }
    window.location.replace(readNext());
  }, [ready, user, mode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const title =
    mode === "signup" ? "회원가입"
      : mode === "emailConfirm" ? "이메일 확인"
        : mode === "phoneConfirm" ? "휴대폰 확인"
          : mode === "reset" ? "비밀번호 찾기"
            : mode === "findId" ? "아이디 찾기"
              : "로그인";

  const lead =
    mode === "signup" ? "아래 정보를 적어 주세요."
      : mode === "emailConfirm" ? "메일함의 확인 링크를 누르면 가입이 끝나요."
        : mode === "phoneConfirm" ? "문자로 받은 확인 번호를 적어 주세요."
          : mode === "reset" ? "가입한 이메일을 적어 주세요."
            : mode === "findId" ? "휴대폰 확인이 준비되면 아이디 찾기를 열 예정이에요."
              : next === "/care" || next === "/link"
                ? "가족 연동을 하려면 로그인해 주세요."
                : "이메일로 로그인해 주세요.";

  async function submitLogin() {
    if (busy || user) return;
    setBusy(true);
    setMessage("");
    const failure = await signInWithEmail(email, password);
    if (failure === EMAIL_NOT_CONFIRMED) {
      setMode("emailConfirm");
      setMessage("이메일 확인이 필요해요. 메일함의 링크를 눌러 주세요.");
      setResendIn(0);
      setBusy(false);
      return;
    }
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
      { name, nickname, email, phone, password, passwordConfirm, agreeTerms, agreePrivacy },
      readNext(),
    );
    if (!result.ok) {
      if (result.message.includes("이미 가입")) {
        setMode("login");
      }
      setMessage(result.message);
      setBusy(false);
      return;
    }
    setPassword("");
    setPasswordConfirm("");
    setOtp("");
    setBusy(false);
    if (result.needsPhoneConfirm) {
      if (result.phone) setPhone(formatPhoneDisplay(result.phone));
      setMode("phoneConfirm");
      setMessage("확인 문자를 보냈어요. 번호를 적어 주세요.");
      setResendIn(PHONE_RESEND_COOLDOWN_SEC);
      return;
    }
    if (result.needsEmailConfirm) {
      setMode("emailConfirm");
      setMessage("확인 메일을 보냈어요. 메일함·스팸함을 확인해 주세요. 다시 받기는 메일이 안 올 때만 눌러 주세요.");
      setResendIn(EMAIL_RESEND_COOLDOWN_SEC);
      return;
    }
    window.location.replace(readNext());
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
    window.location.replace(readNext());
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
    try {
      sessionStorage.removeItem("ssp.pendingSignupPhone");
    } catch {
      // ignore
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
    setMessage("안내 메일을 보냈어요. 메일함을 확인해 주세요.");
    setBusy(false);
  }

  async function resendEmail() {
    if (!canResend) return;
    setBusy(true);
    setMessage("");
    const failure = await resendSignupEmail(email, readNext());
    if (failure) {
      setMessage(failure);
      if (failure.includes("한도") || failure.includes("자주")) {
        setResendIn(RATE_LIMIT_COOLDOWN_SEC);
      }
      setBusy(false);
      return;
    }
    setMessage("확인 메일을 다시 보냈어요. 스팸함도 확인해 주세요.");
    setResendIn(EMAIL_RESEND_COOLDOWN_SEC);
    setBusy(false);
  }

  async function resendPhone() {
    if (!canResend) return;
    setBusy(true);
    setMessage("");
    const failure = await sendPhoneOtp(phone);
    if (failure) {
      setMessage(failure);
      if (failure.includes("한도") || failure.includes("자주") || failure.includes("too many")) {
        setResendIn(RATE_LIMIT_COOLDOWN_SEC);
      }
      setBusy(false);
      return;
    }
    setMessage("확인 문자를 다시 보냈어요.");
    setResendIn(PHONE_RESEND_COOLDOWN_SEC);
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
    if (nextMode !== "emailConfirm" && nextMode !== "phoneConfirm") setResendIn(0);
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
            required
            value={email}
            placeholder="이메일 주소"
            disabled={busy}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field
            id="auth-password"
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            placeholder="비밀번호"
            disabled={busy}
            onChange={(event) => setPassword(event.target.value)}
          />
          <BigButton type="submit" disabled={busy}>로그인</BigButton>
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
            required
            value={name}
            maxLength={40}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
          <Field
            id="auth-nickname"
            label="닉네임 (선택)"
            autoComplete="nickname"
            value={nickname}
            maxLength={20}
            disabled={busy}
            onChange={(event) => setNickname(event.target.value)}
          />
          <Field
            id="auth-email-signup"
            label="이메일"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            placeholder="이메일 주소"
            disabled={busy}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field
            id="auth-phone"
            label="휴대폰"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            required
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
            required
            value={password}
            placeholder="비밀번호"
            disabled={busy}
            onChange={(event) => setPassword(event.target.value)}
          />
          <ul className="auth-rules" aria-live="polite">
            <li className={password && !passwordHints.includes("8자 이상") ? "ok" : undefined}>8자 이상</li>
            <li className={password && !passwordHints.includes("영문 소문자 포함") ? "ok" : undefined}>영문 소문자</li>
            <li className={password && !passwordHints.includes("영문 대문자 포함") ? "ok" : undefined}>영문 대문자</li>
            <li className={password && !passwordHints.includes("숫자 포함") ? "ok" : undefined}>숫자</li>
            <li className={password && !passwordHints.includes("특수문자 포함") ? "ok" : undefined}>특수문자</li>
          </ul>
          <Field
            id="auth-password-confirm"
            label="비밀번호 확인"
            type="password"
            autoComplete="new-password"
            required
            value={passwordConfirm}
            placeholder="비밀번호 확인"
            disabled={busy}
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
          <ul className="auth-rules auth-rules-confirm" aria-live="polite">
            <li
              className={
                passwordConfirm
                  ? password && passwordConfirm === password
                    ? "ok"
                    : "bad"
                  : undefined
              }
            >
              {passwordConfirm
                ? password && passwordConfirm === password
                  ? "같아요"
                  : "같지 않아요"
                : "비밀번호가 같은지 확인"}
            </li>
          </ul>
          <div className="auth-agreements">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={agreeTerms}
                disabled={busy}
                onChange={(event) => setAgreeTerms(event.target.checked)}
              />
              <span>
                <Link href="/terms" target="_blank">이용약관</Link>에 동의합니다
                <abbr className="field-required" title="필수">*</abbr>
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
                <Link href="/privacy" target="_blank">개인정보처리방침</Link>에 동의합니다
                <abbr className="field-required" title="필수">*</abbr>
              </span>
            </label>
          </div>
          <BigButton type="submit" disabled={busy}>가입하기</BigButton>
        </form>
      ) : null}

      {mode === "emailConfirm" ? (
        <div className="auth-confirm">
          <div className="auth-confirm-card" aria-live="polite">
            <span className="auth-confirm-icon" aria-hidden="true">
              <Icon name="mail" />
            </span>
            <p className="auth-confirm-title">메일을 확인해 주세요</p>
            <p className="auth-confirm-email">{email || "가입한 이메일"}</p>
            <ol className="auth-confirm-steps">
              <li>메일함에서 <strong>확인 링크</strong>를 눌러 주세요.</li>
              <li>없으면 스팸함·프로모션함도 확인해 주세요.</li>
              <li>링크를 누르면 자동으로 로그인돼요.</li>
              <li>확인 메일은 시간당 몇 통만 보낼 수 있어요. 다시 받기는 꼭 필요할 때만 눌러 주세요.</li>
            </ol>
          </div>

          {message ? <Status>{message}</Status> : null}

          <div className="auth-confirm-actions">
            <BigButton disabled={!canResend || !email} onClick={() => void resendEmail()}>
              {resendIn > 0 ? `${formatCooldown(resendIn)} 후 다시 받기` : "메일 다시 받기"}
            </BigButton>
            <p className="auth-note">
              {resendIn > 0
                ? "이미 보낸 메일을 먼저 확인해 주세요."
                : "메일이 안 올 때만 다시 받아 주세요. 자주 누르면 한도에 걸려요."}
            </p>
          </div>

          <details className="auth-confirm-more">
            <summary>메일 속 확인 번호로 하기</summary>
            <form
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitEmailOtp();
              }}
            >
              <Field
                id="auth-email-otp"
                label="확인 번호"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                placeholder="8자리 숫자"
                disabled={busy || !email}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
              />
              <BigButton type="submit" disabled={busy || otp.length < 6 || !email}>
                확인 완료
              </BigButton>
            </form>
          </details>

          <p className="auth-links">
            <button type="button" className="auth-link" disabled={busy} onClick={() => switchMode("login")}>
              로그인으로
            </button>
          </p>
        </div>
      ) : null}

      {mode === "phoneConfirm" ? (
        <div className="auth-confirm">
          <div className="auth-confirm-card" aria-live="polite">
            <span className="auth-confirm-icon" aria-hidden="true">
              <Icon name="phone" />
            </span>
            <p className="auth-confirm-title">문자를 확인해 주세요</p>
            <p className="auth-confirm-email">{phone || "가입한 휴대폰"}</p>
            <ol className="auth-confirm-steps">
              <li>문자로 온 <strong>확인 번호</strong>를 아래에 적어 주세요.</li>
              <li>문자가 없으면 잠시 기다린 뒤 다시 받아 주세요.</li>
              <li>번호를 맞추면 가입이 끝나요.</li>
            </ol>
          </div>

          {message ? <Status>{message}</Status> : null}

          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitPhoneOtp();
            }}
          >
            <Field
              id="auth-phone-otp"
              label="확인 번호"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              placeholder="6자리 숫자"
              disabled={busy || !phone}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
            />
            <BigButton type="submit" disabled={busy || otp.length < 6 || !phone}>
              확인 완료
            </BigButton>
          </form>

          <div className="auth-confirm-actions">
            <LineButton disabled={!canResend || !phone} onClick={() => void resendPhone()}>
              {resendIn > 0 ? `${formatCooldown(resendIn)} 후 다시 받기` : "문자 다시 받기"}
            </LineButton>
          </div>

          <p className="auth-links">
            <button
              type="button"
              className="auth-link"
              disabled={busy}
              onClick={() => {
                void signOut().then(() => switchMode("login"));
              }}
            >
              로그인으로
            </button>
          </p>
        </div>
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
            required
            value={email}
            placeholder="가입한 이메일"
            disabled={busy}
            onChange={(event) => setEmail(event.target.value)}
          />
          <BigButton type="submit" disabled={busy}>안내 메일 받기</BigButton>
        </form>
      ) : null}

      {mode === "findId" ? (
        <div className="auth-confirm-card auth-find-result" aria-live="polite">
          <p className="auth-confirm-title">지금은 안내만 드려요</p>
          <p className="auth-confirm-desc">
            휴대폰 문자 확인이 준비되기 전에는 이름·번호만으로 이메일을 찾아드리지 않아요.
            가입 이메일이 기억나면 비밀번호 찾기를 이용해 주세요.
          </p>
          <div className="auth-find-result-actions">
            <BigButton onClick={() => switchMode("reset")}>비밀번호 찾기</BigButton>
            <LineButton onClick={() => switchMode("login")}>로그인</LineButton>
          </div>
        </div>
      ) : null}

      {mode === "login" ? (
        <nav className="auth-links" aria-label="계정 안내">
          <button type="button" className="auth-link" disabled={busy} onClick={() => switchMode("findId")}>
            아이디 찾기
          </button>
          <span className="auth-link-sep" aria-hidden="true">·</span>
          <button type="button" className="auth-link" disabled={busy} onClick={() => switchMode("reset")}>
            비밀번호 찾기
          </button>
          <span className="auth-link-sep" aria-hidden="true">·</span>
          <button type="button" className="auth-link" disabled={busy} onClick={() => switchMode("signup")}>
            회원가입
          </button>
        </nav>
      ) : null}

      {mode === "signup" ? (
        <p className="auth-links">
          이미 계정이 있으면{" "}
          <button type="button" className="auth-link" disabled={busy} onClick={() => switchMode("login")}>
            로그인
          </button>
        </p>
      ) : null}

      {mode === "reset" || mode === "findId" ? (
        <p className="auth-links">
          <button type="button" className="auth-link" disabled={busy} onClick={() => switchMode("login")}>
            로그인으로
          </button>
        </p>
      ) : null}

      {mode === "login" ? (
        <>
          <div className="auth-divider" role="separator" aria-label="또는">
            <span>또는</span>
          </div>
          <BigButton tone="kakao" disabled={busy} onClick={() => void login("kakao")}>카카오 간편 로그인</BigButton>
          <BigButton tone="naver" disabled={busy} onClick={() => void login("naver" as Provider)}>네이버 간편 로그인</BigButton>
          <BigButton tone="google" disabled={busy} onClick={() => void login("google")}>구글 간편 로그인</BigButton>
        </>
      ) : null}

      {message && mode !== "emailConfirm" ? <Status>{message}</Status> : null}
    </Screen>
  );
}
