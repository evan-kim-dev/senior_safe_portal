import { isTextSize, sanitizeChannels, sanitizeName, sanitizePhone, type SetupPayload } from "@/lib/domain/setup";
import type { GuardianSettings, TextSize } from "@/lib/domain/types";
import { isFamilyCode } from "@/lib/domain/validation";
import { readJson, writeJson } from "./storage";

const KEY = "senior-safe-guardian";

const EMPTY: GuardianSettings = {
  name: "",
  phone: "",
  textSize: "normal",
  channels: [],
  familyCode: "",
  region: "",
};

export function loadGuardian(): GuardianSettings {
  const parsed = readJson(KEY);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ...EMPTY };
  const value = parsed as Partial<Record<keyof GuardianSettings, unknown>>;
  return {
    name: typeof value.name === "string" ? value.name : "",
    phone: typeof value.phone === "string" ? value.phone : "",
    textSize: isTextSize(value.textSize) ? value.textSize : "normal",
    channels: sanitizeChannels(value.channels),
    familyCode: typeof value.familyCode === "string" ? value.familyCode : "",
    region: typeof value.region === "string" ? value.region : "",
  };
}

function store(next: GuardianSettings) {
  writeJson(KEY, next);
  applyTextSize(next.textSize);
}

export function ensureFamilyCode(): string {
  const current = loadGuardian();
  if (isFamilyCode(current.familyCode)) return current.familyCode;
  const familyCode = crypto.randomUUID();
  writeJson(KEY, { ...current, familyCode });
  return familyCode;
}

/** 서버 가족 id 와 이 기기 localStorage 코드를 맞춘다. */
export function setFamilyCode(familyCode: string): GuardianSettings {
  if (!isFamilyCode(familyCode)) return loadGuardian();
  const next = { ...loadGuardian(), familyCode };
  store(next);
  return next;
}

/** 연결 해제·초기화 후 기기 쪽 가족 코드를 비운다. */
export function clearFamilyCode(): GuardianSettings {
  const next = { ...loadGuardian(), familyCode: "" };
  store(next);
  return next;
}

export function applySetup(settings: SetupPayload) {
  store({
    ...loadGuardian(),
    name: sanitizeName(settings.name),
    phone: sanitizePhone(settings.phone),
    textSize: settings.textSize,
    channels: sanitizeChannels(settings.channels),
    familyCode: settings.familyCode,
  });
}

export function saveCare(settings: Pick<GuardianSettings, "name" | "phone" | "textSize" | "channels">): GuardianSettings {
  const next: GuardianSettings = {
    ...loadGuardian(),
    name: sanitizeName(settings.name),
    phone: sanitizePhone(settings.phone),
    textSize: settings.textSize,
    channels: sanitizeChannels(settings.channels),
  };
  store(next);
  return next;
}

export function saveRegion(region: string): GuardianSettings {
  const next: GuardianSettings = { ...loadGuardian(), region: region.trim() };
  store(next);
  return next;
}

export function saveTextSize(textSize: TextSize): GuardianSettings {
  const next: GuardianSettings = { ...loadGuardian(), textSize };
  store(next);
  return next;
}

export function applyTextSize(size: TextSize) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.text = size;
}
