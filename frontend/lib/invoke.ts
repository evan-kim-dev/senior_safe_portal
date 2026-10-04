import "server-only";

const FAIL = "지금 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.";

type FunctionResult = {
  ok: boolean;
  status: number;
  data: Record<string, unknown> | null;
  missingConfig: boolean;
  transportError: boolean;
};

export function safeMessage(raw: unknown, fallback = FAIL): string {
  if (typeof raw !== "string") return fallback;
  const message = raw.replace(/\s+/g, " ").trim();
  if (!message || /api[_-]?key|gemini|supabase|stack|AIza|Bearer|token|NAVER_|DATA_GO|YouTube API/i.test(message)) {
    return fallback;
  }
  return message.slice(0, 140);
}

export async function postFunction(name: string, body: unknown, timeoutMs: number): Promise<FunctionResult> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return { ok: false, status: 503, data: null, missingConfig: true, transportError: false };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });

    let data: Record<string, unknown> | null = null;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      data = null;
    }

    return { ok: response.ok, status: response.status, data, missingConfig: false, transportError: false };
  } catch {
    return { ok: false, status: 502, data: null, missingConfig: false, transportError: true };
  }
}

export async function callFunction(name: string, body: unknown) {
  const result = await postFunction(name, body, 50_000);
  if (result.missingConfig || result.transportError) {
    return {
      ok: false,
      status: result.missingConfig ? 503 : 502,
      data: { message: FAIL } as Record<string, unknown>,
    };
  }
  return { ok: result.ok, status: result.status, data: result.data ?? {} };
}
