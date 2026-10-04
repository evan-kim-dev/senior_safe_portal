import { extractHttpUrl } from "./url";

const PERMISSION_KEY = "senior-safe-clipboard-ok";

export function markClipboardAllowed(): void {
  try {
    window.sessionStorage.setItem(PERMISSION_KEY, "1");
  } catch {
    // 권한 표시를 못 남겨도 이번 붙여넣기는 진행한다.
  }
}

export function clearClipboardAllowed(): void {
  try {
    window.sessionStorage.removeItem(PERMISSION_KEY);
  } catch {
    // 저장소가 없어도 다음 읽기를 막으면 된다.
  }
}

export async function hasClipboardPermission(): Promise<boolean> {
  try {
    if (window.sessionStorage.getItem(PERMISSION_KEY) === "1") return true;
  } catch {
    // sessionStorage 가 없으면 브라우저 권한만 본다.
  }

  try {
    const status = await navigator.permissions.query({
      name: "clipboard-read" as PermissionName,
    });
    return status.state === "granted";
  } catch {
    return false;
  }
}

/** 클립보드에서 http(s) 주소만 꺼낸다. 없으면 null. */
export async function readClipboardHttpUrl(): Promise<string | null> {
  if (!navigator.clipboard?.readText) return null;

  const text = await navigator.clipboard.readText();
  return extractHttpUrl(text);
}
