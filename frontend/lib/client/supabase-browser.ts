"use client";

import { createClient, type Provider, type SupabaseClient } from "@supabase/supabase-js";
import {
  isOtpCode,
  normalizeEmail,
  normalizePhoneKr,
  validateLoginForm,
  validateSignUpForm,
  type SignUpFormInput,
} from "@/lib/domain/auth-form";

let client: SupabaseClient | null = null;

/** 브라우저에는 공개 anon 키만 있다. 쓰기 권한은 board_posts RLS 가 막는다. */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return client;
}

/** `/login?next=/care` 처럼 안전한 내부 경로만 허용한다. */
export function safeNextPath(next: string | null | undefined, fallback = "/board"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return fallback;
  if (next.includes("\\") || next.includes("@") || /[\u0000-\u001F\u007F]/.test(next)) return fallback;
  return next;
}

export function authCallbackUrl(next?: string | null): string {
  const path = safeNextPath(next, "/board");
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;
}

function authErrorMessage(error: { message?: string; code?: string; status?: number } | null, fallback: string): string {
  const text = (error?.message || "").toLowerCase();
  const code = (error?.code || "").toLowerCase();
  if (code.includes("email_not_confirmed") || text.includes("email not confirmed")) {
    return "이메일 확인이 필요해요. 메일함을 확인해 주세요.";
  }
  if (code.includes("invalid_credentials") || text.includes("invalid login") || text.includes("invalid credentials")) {
    return "이메일 또는 비밀번호가 맞지 않아요.";
  }
  if (text.includes("user already registered") || text.includes("already been registered")) {
    return "이미 가입한 이메일이에요. 로그인해 주세요.";
  }
  if (text.includes("password") && (text.includes("weak") || text.includes("least") || text.includes("characters"))) {
    return "비밀번호를 확인해 주세요. 영문 대·소문자·숫자·특수문자를 넣어 주세요.";
  }
  if (text.includes("rate limit") || text.includes("too many") || error?.status === 429) {
    return "너무 자주 눌렀어요. 잠시 후 다시 눌러 주세요.";
  }
  if (text.includes("sms") || text.includes("phone") || text.includes("twilio") || text.includes("provider")) {
    return "문자를 보내지 못했어요. 이메일 확인을 먼저 해 주세요.";
  }
  if (text.includes("otp") || text.includes("token") || text.includes("expired")) {
    return "확인 번호가 맞지 않아요. 다시 받아 주세요.";
  }
  return fallback;
}

export async function signInWith(provider: Provider, next?: string | null): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return "지금 로그인할 수 없어요. 잠시 후 다시 눌러 주세요.";

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: authCallbackUrl(next) },
    });
    return error ? "로그인하지 못했어요. 잠시 후 다시 눌러 주세요." : "";
  } catch {
    return "로그인하지 못했어요. 잠시 후 다시 눌러 주세요.";
  }
}

export async function signInWithEmail(email: string, password: string): Promise<string> {
  const invalid = validateLoginForm(email, password);
  if (invalid) return invalid;

  const supabase = getSupabase();
  if (!supabase) return "지금 로그인할 수 없어요. 잠시 후 다시 눌러 주세요.";

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    return error ? authErrorMessage(error, "로그인하지 못했어요. 잠시 후 다시 눌러 주세요.") : "";
  } catch {
    return "로그인하지 못했어요. 잠시 후 다시 눌러 주세요.";
  }
}

export type SignUpResult =
  | { ok: true; needsEmailConfirm: boolean }
  | { ok: false; message: string };

export async function signUpWithEmail(input: SignUpFormInput, next?: string | null): Promise<SignUpResult> {
  const checked = validateSignUpForm(input);
  if (!checked.ok) return { ok: false, message: checked.message };

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "지금 가입할 수 없어요. 잠시 후 다시 눌러 주세요." };

  try {
    const { data, error } = await supabase.auth.signUp({
      email: checked.value.email,
      password: checked.value.password,
      options: {
        emailRedirectTo: authCallbackUrl(next),
        data: {
          full_name: checked.value.name,
          nickname: checked.value.nickname,
          phone: checked.value.phone,
        },
      },
    });
    if (error) {
      return { ok: false, message: authErrorMessage(error, "가입하지 못했어요. 잠시 후 다시 눌러 주세요.") };
    }
    return { ok: true, needsEmailConfirm: !data.session };
  } catch {
    return { ok: false, message: "가입하지 못했어요. 잠시 후 다시 눌러 주세요." };
  }
}

export async function resendSignupEmail(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  if (!normalized) return "이메일을 적어 주세요.";
  const supabase = getSupabase();
  if (!supabase) return "메일을 보내지 못했어요. 잠시 후 다시 눌러 주세요.";

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalized,
      options: { emailRedirectTo: authCallbackUrl("/board") },
    });
    return error ? authErrorMessage(error, "메일을 다시 보내지 못했어요.") : "";
  } catch {
    return "메일을 다시 보내지 못했어요.";
  }
}

export async function verifyEmailOtp(email: string, token: string): Promise<string> {
  const normalized = normalizeEmail(email);
  if (!normalized) return "이메일을 적어 주세요.";
  if (!isOtpCode(token)) return "확인 번호를 적어 주세요.";

  const supabase = getSupabase();
  if (!supabase) return "확인하지 못했어요. 잠시 후 다시 눌러 주세요.";

  try {
    const { error } = await supabase.auth.verifyOtp({
      email: normalized,
      token: token.trim(),
      type: "signup",
    });
    return error ? authErrorMessage(error, "이메일을 확인하지 못했어요.") : "";
  } catch {
    return "이메일을 확인하지 못했어요.";
  }
}

export async function sendPasswordReset(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  if (!normalized) return "이메일을 적어 주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return "이메일을 확인해 주세요.";

  const supabase = getSupabase();
  if (!supabase) return "메일을 보내지 못했어요. 잠시 후 다시 눌러 주세요.";

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: authCallbackUrl("/login"),
    });
    // 계정 존재 여부는 알려 주지 않는다.
    return error ? authErrorMessage(error, "메일을 보내지 못했어요.") : "";
  } catch {
    return "메일을 보내지 못했어요.";
  }
}

export async function sendPhoneOtp(phoneRaw: string): Promise<string> {
  const phone = normalizePhoneKr(phoneRaw);
  if (!phone) return "휴대폰 번호를 적어 주세요.";

  const supabase = getSupabase();
  if (!supabase) return "문자를 보내지 못했어요.";

  try {
    const { error } = await supabase.auth.updateUser({ phone });
    return error ? authErrorMessage(error, "문자를 보내지 못했어요.") : "";
  } catch {
    return "문자를 보내지 못했어요.";
  }
}

export async function verifyPhoneOtp(phoneRaw: string, token: string): Promise<string> {
  const phone = normalizePhoneKr(phoneRaw);
  if (!phone) return "휴대폰 번호를 적어 주세요.";
  if (!isOtpCode(token)) return "확인 번호를 적어 주세요.";

  const supabase = getSupabase();
  if (!supabase) return "휴대폰을 확인하지 못했어요.";

  try {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: token.trim(),
      type: "phone_change",
    });
    return error ? authErrorMessage(error, "휴대폰을 확인하지 못했어요.") : "";
  } catch {
    return "휴대폰을 확인하지 못했어요.";
  }
}

/** @deprecated 테스트 호환용. validateLoginForm 을 쓰세요. */
export function validateEmailPassword(email: string, password: string): string {
  return validateLoginForm(email, password);
}
