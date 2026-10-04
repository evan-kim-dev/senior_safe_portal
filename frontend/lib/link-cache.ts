import type { CheckKind, CheckSuccess, CheckVerdict } from "./types";
import { serviceFetch } from "./feeds";
import { cacheUrlKey } from "./url";
import { headlineFor } from "./verdict";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

type StoredCheck = {
  url_key: string;
  url: string;
  kind: CheckKind;
  verdict: CheckVerdict;
  headline: "괜찮아요" | "누르지 마세요";
  title: string;
  reason: string;
  checked_at: string;
};

export async function readFreshCheck(rawUrl: string): Promise<CheckSuccess | null> {
  try {
    const key = cacheUrlKey(rawUrl);
    const response = await serviceFetch(
      `link_checks?url_key=eq.${encodeURIComponent(key)}&select=url,kind,verdict,headline,title,reason,checked_at`,
    );
    if (!response?.ok) return null;

    const rows = (await response.json()) as StoredCheck[];
    const row = rows[0];
    if (!row?.checked_at) return null;
    if (Date.now() - new Date(row.checked_at).getTime() > SIX_HOURS_MS) return null;
    if (row.verdict !== "safe" && row.verdict !== "danger") return null;

    return {
      ok: true,
      url: row.url,
      kind: row.kind === "video" ? "video" : "link",
      verdict: row.verdict,
      headline: headlineFor(row.verdict),
      title: row.title,
      reason: row.reason,
    };
  } catch {
    return null;
  }
}

export async function saveCheck(rawUrl: string, result: CheckSuccess): Promise<void> {
  let key = "";
  try {
    key = cacheUrlKey(result.url || rawUrl);
  } catch {
    return;
  }

  await serviceFetch("link_checks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      url_key: key,
      url: result.url,
      kind: result.kind,
      verdict: result.verdict,
      headline: result.headline,
      title: result.title,
      reason: result.reason,
      checked_at: new Date().toISOString(),
    }),
  });
}
