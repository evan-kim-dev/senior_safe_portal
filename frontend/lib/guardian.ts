import type { GuardianSettings, TextSize } from "./types";

const KEY = "senior-safe-guardian";

const EMPTY: GuardianSettings = {
  name: "",
  phone: "",
  textSize: "normal",
  channels: [],
  familyCode: "",
  region: "",
};

function isTextSize(value: unknown): value is TextSize {
  return value === "normal" || value === "large" || value === "xlarge";
}

export function loadGuardian(): GuardianSettings {
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "{}") as Partial<GuardianSettings>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      textSize: isTextSize(parsed.textSize) ? parsed.textSize : "normal",
      channels: Array.isArray(parsed.channels) ? parsed.channels.filter((item) => typeof item === "string") : [],
      familyCode: typeof parsed.familyCode === "string" ? parsed.familyCode : "",
      region: typeof parsed.region === "string" ? parsed.region : "",
    };
  } catch {
    return EMPTY;
  }
}

export function ensureFamilyCode(): string {
  const current = loadGuardian();
  if (/^[0-9a-f-]{36}$/i.test(current.familyCode)) return current.familyCode;
  const familyCode = crypto.randomUUID();
  window.localStorage.setItem(KEY, JSON.stringify({ ...current, familyCode }));
  return familyCode;
}

export function applySetup(settings: Pick<GuardianSettings, "name" | "phone" | "textSize" | "channels" | "familyCode">) {
  const prev = loadGuardian();
  const next: GuardianSettings = {
    ...prev,
    name: settings.name.trim(),
    phone: settings.phone.replace(/[^\d+]/g, ""),
    textSize: settings.textSize,
    channels: settings.channels,
    familyCode: settings.familyCode,
  };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  applyTextSize(next.textSize);
}

export function saveCare(settings: Pick<GuardianSettings, "name" | "phone" | "textSize" | "channels">) {
  const prev = loadGuardian();
  const next: GuardianSettings = {
    ...prev,
    name: settings.name.trim(),
    phone: settings.phone.replace(/[^\d+]/g, ""),
    textSize: settings.textSize,
    channels: settings.channels,
  };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  applyTextSize(next.textSize);
}

export function applyTextSize(size: TextSize) {
  document.documentElement.dataset.text = size;
}

export function tellFamily(url: string) {
  const { phone } = loadGuardian();
  if (!phone) return;

  const text = `이 주소는 누르지 마세요\n${url}`;
  const kakao = `kakaotalk://send?text=${encodeURIComponent(text)}`;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const sms = ios
    ? `sms:${phone}&body=${encodeURIComponent(text)}`
    : `sms:${phone}?body=${encodeURIComponent(text)}`;

  window.location.href = kakao;
  window.setTimeout(() => {
    if (document.visibilityState === "visible") window.location.href = sms;
  }, 700);
}
