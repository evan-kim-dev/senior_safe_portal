import "server-only";
import { timingSafeEqual } from "node:crypto";

function safeEqualText(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function cronAuthorized(request: Request, cronSecret: string): boolean {
  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ") && safeEqualText(bearer.slice(7), cronSecret)) return true;
  const header = request.headers.get("x-cron-secret");
  return typeof header === "string" && safeEqualText(header, cronSecret);
}

export type RefreshInvokeResult = {
  name: string;
  ok: boolean;
  status: number;
  refreshed?: number;
  total?: number;
};

/** Edge 응답 본문은 그대로 노출하지 않고 요약만 남긴다. */
export function summarizeRefreshPayload(name: string, status: number, payload: unknown): RefreshInvokeResult {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const ok = status >= 200 && status < 300 && record.ok === true;
  const refreshed = typeof record.refreshed === "number" ? record.refreshed : undefined;
  const total = typeof record.total === "number" ? record.total : undefined;
  return { name, ok, status, refreshed, total };
}

export async function invokeRefreshFunction(
  baseUrl: string,
  serviceKey: string,
  cronSecret: string,
  name: string,
  body: Record<string, unknown> = {},
): Promise<RefreshInvokeResult> {
  const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
      "x-cron-secret": cronSecret,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(280_000),
  });
  const payload = await response.json().catch(() => ({}));
  return summarizeRefreshPayload(name, response.status, payload);
}
