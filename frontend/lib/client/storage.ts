type Area = "local" | "session";

function storageOf(area: Area): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** 사생활 보호 모드·용량 초과에서도 화면이 멈추지 않게 저장소 오류를 삼킨다. */
export function readString(key: string, area: Area = "local"): string | null {
  try {
    return storageOf(area)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string, area: Area = "local"): boolean {
  try {
    const storage = storageOf(area);
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string, area: Area = "local"): void {
  try {
    storageOf(area)?.removeItem(key);
  } catch {
    // 지우지 못해도 다음 읽기에서 형식 검사로 걸러진다.
  }
}

export function readJson(key: string, area: Area = "local"): unknown {
  const raw = readString(key, area);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export function writeJson(key: string, value: unknown, area: Area = "local"): boolean {
  try {
    return writeString(key, JSON.stringify(value), area);
  } catch {
    return false;
  }
}
