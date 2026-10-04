import { extractHttpUrl } from "@/lib/domain/url";
import { readString, removeItem, writeString } from "./storage";

const PERMISSION_KEY = "senior-safe-clipboard-ok";

export function markClipboardAllowed(): void {
  writeString(PERMISSION_KEY, "1", "session");
}

export function clearClipboardAllowed(): void {
  removeItem(PERMISSION_KEY, "session");
}

export async function hasClipboardPermission(): Promise<boolean> {
  if (readString(PERMISSION_KEY, "session") === "1") return true;

  try {
    const status = await navigator.permissions.query({ name: "clipboard-read" as PermissionName });
    return status.state === "granted";
  } catch {
    return false;
  }
}

/** 클립보드에서 http(s) 주소만 꺼낸다. 없으면 null. 권한이 없으면 던진다. */
export async function readClipboardHttpUrl(): Promise<string | null> {
  if (!navigator.clipboard?.readText) return null;
  const text = await navigator.clipboard.readText();
  return extractHttpUrl(text);
}
