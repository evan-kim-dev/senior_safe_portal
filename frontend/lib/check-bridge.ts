const KEY = "pending-check";

export function sendToCheck(url: string, run = false) {
  sessionStorage.setItem(KEY, JSON.stringify({ url, run }));
  window.location.assign("/");
}

export function readPendingCheck(): { url: string; run: boolean } | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KEY);
  try {
    const parsed = JSON.parse(raw) as { url?: string; run?: boolean };
    if (typeof parsed.url !== "string" || !parsed.url.trim()) return null;
    return { url: parsed.url.trim(), run: parsed.run === true };
  } catch {
    return null;
  }
}
