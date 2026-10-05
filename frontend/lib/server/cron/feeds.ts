import "server-only";

export function cronAuthorized(request: Request, cronSecret: string): boolean {
  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${cronSecret}`) return true;
  return request.headers.get("x-cron-secret") === cronSecret;
}

export async function invokeRefreshFunction(
  baseUrl: string,
  serviceKey: string,
  cronSecret: string,
  name: string,
  body: Record<string, unknown> = {},
): Promise<{ name: string; ok: boolean; status: number; body: unknown }> {
  const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
      "x-cron-secret": cronSecret,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  const ok = response.ok && Boolean((payload as { ok?: boolean }).ok);
  return { name, ok, status: response.status, body: payload };
}
