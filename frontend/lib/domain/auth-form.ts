/** 가입·로그인 입력 검사. 화면/서버에서 같은 규칙을 쓴다. */

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 40;
export const MIN_NICKNAME_LENGTH = 2;
export const MAX_NICKNAME_LENGTH = 20;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[0-9A-Za-z가-힣][0-9A-Za-z가-힣 ·._-]{0,38}[0-9A-Za-z가-힣]$|^[0-9A-Za-z가-힣]{2}$/;
const NICKNAME_RE = /^[0-9A-Za-z가-힣][0-9A-Za-z가-힣._-]{0,18}[0-9A-Za-z가-힣]$|^[0-9A-Za-z가-힣]{2}$/;
const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(normalizeEmail(value));
}

/** 한국 휴대폰을 +82… 형태로 만든다. 실패하면 빈 문자열. */
export function normalizePhoneKr(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (/^010\d{8}$/.test(digits)) return `+82${digits.slice(1)}`;
  if (/^10\d{8}$/.test(digits)) return `+82${digits}`;
  if (/^8210\d{8}$/.test(digits)) return `+${digits}`;
  return "";
}

export function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) issues.push(`${MIN_PASSWORD_LENGTH}자 이상`);
  if (password.length > MAX_PASSWORD_LENGTH) issues.push(`${MAX_PASSWORD_LENGTH}자 이하`);
  if (!/[a-z]/.test(password)) issues.push("영문 소문자 포함");
  if (!/[A-Z]/.test(password)) issues.push("영문 대문자 포함");
  if (!/\d/.test(password)) issues.push("숫자 포함");
  if (!SPECIAL_RE.test(password)) issues.push("특수문자 포함");
  return issues;
}

export type SignUpFormInput = {
  name: string;
  nickname: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
};

export type SignUpFormValue = {
  name: string;
  nickname: string;
  email: string;
  phone: string;
  password: string;
};

export function validateSignUpForm(input: SignUpFormInput): { ok: true; value: SignUpFormValue } | { ok: false; message: string } {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < MIN_NAME_LENGTH) return { ok: false, message: "이름을 적어 주세요." };
  if (name.length > MAX_NAME_LENGTH || !NAME_RE.test(name)) return { ok: false, message: "이름을 확인해 주세요." };

  const nickname = input.nickname.trim().replace(/\s+/g, "");
  if (nickname) {
    if (nickname.length < MIN_NICKNAME_LENGTH) return { ok: false, message: "닉네임을 확인해 주세요." };
    if (nickname.length > MAX_NICKNAME_LENGTH || !NICKNAME_RE.test(nickname)) {
      return { ok: false, message: "닉네임을 확인해 주세요." };
    }
  }

  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, message: "이메일을 적어 주세요." };
  if (!isEmail(email)) return { ok: false, message: "이메일을 확인해 주세요." };

  const phone = normalizePhoneKr(input.phone);
  if (!phone) return { ok: false, message: "휴대폰 번호를 적어 주세요." };

  const issues = passwordIssues(input.password);
  if (issues.length) return { ok: false, message: `비밀번호는 ${issues.join(", ")}해 주세요.` };
  if (input.password !== input.passwordConfirm) return { ok: false, message: "비밀번호가 같지 않아요." };

  if (!input.agreeTerms) return { ok: false, message: "이용약관에 동의해 주세요." };
  if (!input.agreePrivacy) return { ok: false, message: "개인정보 처리방침에 동의해 주세요." };

  return { ok: true, value: { name, nickname, email, phone, password: input.password } };
}

export function validateLoginForm(email: string, password: string): string {
  if (!normalizeEmail(email)) return "이메일을 적어 주세요.";
  if (!isEmail(email)) return "이메일을 확인해 주세요.";
  if (!password) return "비밀번호를 적어 주세요.";
  if (password.length < MIN_PASSWORD_LENGTH) return "비밀번호를 확인해 주세요.";
  return "";
}

export function isOtpCode(value: string): boolean {
  return /^\d{6,8}$/.test(value.trim());
}

/** 화면에만 보여주는 가린 이메일. */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at < 1) return "****";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) return "****";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}
