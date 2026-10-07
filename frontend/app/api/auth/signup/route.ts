import { validateSignUpForm } from "@/lib/domain/auth-form";
import { MESSAGES } from "@/lib/domain/messages";
import { getServerEnv } from "@/lib/server/env";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";
import { createClient } from "@supabase/supabase-js";

/**
 * 이메일 확인 메일 없이 바로 쓸 수 있게 서비스 롤로 계정을 만든다.
 * 비밀번호는 클라이언트가 이어서 signInWithPassword 로 로그인한다.
 */
export const POST = withRoute("auth.signup", { rateLimit: { limit: 8, windowMs: 60_000 } }, async (request) => {
  const body = await readJsonBody(request, 24 * 1024);
  if (!body.ok) {
    return body.reason === "too-large"
      ? json({ ok: false, message: MESSAGES.bodyTooLarge }, { status: 413 })
      : json({ ok: false, message: "가입 정보를 확인해 주세요." }, { status: 400 });
  }

  const raw = (body.value ?? {}) as Record<string, unknown>;
  const checked = validateSignUpForm({
    name: typeof raw.name === "string" ? raw.name : "",
    nickname: typeof raw.nickname === "string" ? raw.nickname : "",
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    password: typeof raw.password === "string" ? raw.password : "",
    passwordConfirm: typeof raw.passwordConfirm === "string" ? raw.passwordConfirm : "",
    accountRole: (typeof raw.accountRole === "string" ? raw.accountRole : "") as "" | "senior" | "guardian",
    birthYear: typeof raw.birthYear === "string" ? raw.birthYear : raw.birthYear == null ? "" : String(raw.birthYear),
    interests: Array.isArray(raw.interests) ? (raw.interests as never[]) : [],
    agreeTerms: raw.agreeTerms === true,
    agreePrivacy: raw.agreePrivacy === true,
  });
  if (!checked.ok) return json({ ok: false, message: checked.message }, { status: 400 });

  const env = getServerEnv();
  if (!env.supabaseUrl || !env.serviceRoleKey) {
    return json({ ok: false, message: "지금 가입할 수 없어요. 잠시 후 다시 눌러 주세요." }, { status: 502 });
  }

  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { error } = await admin.auth.admin.createUser({
    email: checked.value.email,
    password: checked.value.password,
    email_confirm: true,
    user_metadata: {
      full_name: checked.value.name,
      nickname: checked.value.nickname,
      phone: checked.value.phone,
      account_role: checked.value.accountRole,
      birth_year: checked.value.birthYear,
      interests: checked.value.interests,
    },
  });

  if (error) {
    const text = (error.message || "").toLowerCase();
    if (text.includes("already") || text.includes("registered") || text.includes("exists")) {
      return json({ ok: false, message: "이미 가입한 이메일이에요. 로그인해 주세요." }, { status: 409 });
    }
    return json({ ok: false, message: "가입하지 못했어요. 잠시 후 다시 눌러 주세요." }, { status: 502 });
  }

  return json({ ok: true });
});
