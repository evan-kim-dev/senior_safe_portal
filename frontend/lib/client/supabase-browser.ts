"use client";

import { createClient, type Provider, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/** 브라우저에는 공개 anon 키만 있다. 쓰기 권한은 board_posts RLS 가 막는다. */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key);
  return client;
}

/** `/login?next=/care` 처럼 안전한 내부 경로만 허용한다. */
export function safeNextPath(next: string | null | undefined, fallback = "/board"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return fallback;
  if (next.includes("\\") || next.includes("@") || /[\u0000-\u001F\u007F]/.test(next)) return fallback;
  return next;
}

export function validateEmailPassword(email: string, password: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "이메일을 적어 주세요.";
  if (!EMAIL_RE.test(trimmed)) return "이메일 형식을 확인해 주세요.";
  if (!password) return "비밀번호를 적어 주세요.";
  if (password.length < MIN_PASSWORD) return `비밀번호는 ${MIN_PASSWORD}자 이상으로 적어 주세요.`;
  return "";
}

function authErrorMessage(error: { message?: string; code?: string } | null, fallback: string): string {
  const text = (error?.message || "").toLowerCase();
  const code = (error?.code || "").toLowerCase();
  if (code.includes("email_not_confirmed") || text.includes("email not confirmed")) {
    return "이메일 인증이 필요해요. 메일함을 확인해 주세요.";
  }
  if (code.includes("invalid_credentials") || text.includes("invalid login") || text.includes("invalid credentials")) {
    return "이메일 또는 비밀번호가 맞지 않아요.";
  }
  if (text.includes("user already registered") || text.includes("already been registered")) {
    return "이미 가입된 이메일이에요. 로그인해 주세요.";
  }
  if (text.includes("password") && (text.includes("weak") || text.includes("least"))) {
    return `비밀번호는 ${MIN_PASSWORD}자 이상으로 적어 주세요.`;
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "너무 자주 시도했어요. 잠시 후 다시 눌러 주세요.";
  }
  return fallback;
}

export async function signInWith(provider: Provider, next?: string | null): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return "로그인을 시작할 수 없습니다. 잠시 후 다시 눌러 주세요.";

  try {
    const redirectTo = `${window.location.origin}${safeNextPath(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    return error ? "로그인하지 못했습니다. 잠시 후 다시 눌러 주세요." : "";
  } catch {
    return "로그인하지 못했습니다. 잠시 후 다시 눌러 주세요.";
  }
}

export async function signInWithEmail(email: string, password: string): Promise<string> {
  const invalid = validateEmailPassword(email, password);
  if (invalid) return invalid;

  const supabase = getSupabase();
  if (!supabase) return "로그인을 시작할 수 없습니다. 잠시 후 다시 눌러 주세요.";

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return error ? authErrorMessage(error, "로그인하지 못했습니다. 잠시 후 다시 눌러 주세요.") : "";
  } catch {
    return "로그인하지 못했습니다. 잠시 후 다시 눌러 주세요.";
  }
}

export type SignUpResult = { ok: true; needsConfirm: boolean } | { ok: false; message: string };

export async function signUpWithEmail(email: string, password: string, passwordConfirm: string): Promise<SignUpResult> {
  const invalid = validateEmailPassword(email, password);
  if (invalid) return { ok: false, message: invalid };
  if (password !== passwordConfirm) return { ok: false, message: "비밀번호 확인이 같지 않아요." };

  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "가입을 시작할 수 없습니다. 잠시 후 다시 눌러 주세요." };

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      return { ok: false, message: authErrorMessage(error, "가입하지 못했습니다. 잠시 후 다시 눌러 주세요.") };
    }
    return { ok: true, needsConfirm: !data.session };
  } catch {
    return { ok: false, message: "가입하지 못했습니다. 잠시 후 다시 눌러 주세요." };
  }
}
