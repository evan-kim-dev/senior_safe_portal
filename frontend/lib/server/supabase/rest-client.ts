import "server-only";
import type { ServerEnv } from "../env";
import type { Logger } from "../logger";

export type RestRole = "anon" | "service";

export type RestRequest = {
  /** `/rest/v1/` 뒤의 경로와 쿼리. 값은 호출하는 쪽에서 encodeURIComponent 해야 한다. */
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** 지정하면 Next 데이터 캐시에 그 초만큼 보관한다(읽기 전용 공개 데이터만). */
  revalidateSeconds?: number;
  tags?: string[];
};

export type RestFailure = "missing-config" | "http" | "timeout" | "network" | "parse";

export type RestResult<T> =
  | { ok: true; status: number; data: T | null; headers: Headers }
  | { ok: false; status: number; failure: RestFailure };

export type RestClient = {
  request<T>(role: RestRole, request: RestRequest): Promise<RestResult<T>>;
};

const DEFAULT_TIMEOUT_MS = 8_000;

function tableOf(path: string): string {
  return path.split("?")[0] ?? "";
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

export function createRestClient(env: ServerEnv, log: Logger, fetchImpl: typeof fetch = fetch): RestClient {
  function keyFor(role: RestRole): string | null {
    return role === "service" ? env.serviceRoleKey : env.anonKey;
  }

  return {
    async request<T>(role: RestRole, request: RestRequest): Promise<RestResult<T>> {
      const key = keyFor(role);
      const table = tableOf(request.path);
      if (!env.supabaseUrl || !key) {
        log.debug("supabase_rest_skipped", { table, role, reason: "missing-config" });
        return { ok: false, status: 503, failure: "missing-config" };
      }

      const headers = new Headers(request.headers);
      headers.set("apikey", key);
      headers.set("Authorization", `Bearer ${key}`);
      if (request.body !== undefined) headers.set("Content-Type", "application/json");

      const cacheOptions: RequestInit = request.revalidateSeconds
        ? { cache: "force-cache", next: { revalidate: request.revalidateSeconds, tags: request.tags } }
        : { cache: "no-store" };

      let response: Response;
      try {
        response = await fetchImpl(`${env.supabaseUrl}/rest/v1/${request.path}`, {
          method: request.method ?? "GET",
          headers,
          body: request.body === undefined ? undefined : JSON.stringify(request.body),
          signal: AbortSignal.timeout(request.timeoutMs ?? DEFAULT_TIMEOUT_MS),
          ...cacheOptions,
        });
      } catch (error) {
        const failure: RestFailure = isTimeout(error) ? "timeout" : "network";
        log.warn("supabase_rest_failed", { table, role, failure, error });
        return { ok: false, status: failure === "timeout" ? 504 : 502, failure };
      }

      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        log.warn("supabase_rest_failed", { table, role, failure: "http", status: response.status });
        return { ok: false, status: response.status, failure: "http" };
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (response.status === 204 || !contentType.includes("json")) {
        await response.body?.cancel().catch(() => undefined);
        return { ok: true, status: response.status, data: null, headers: response.headers };
      }

      try {
        const text = await response.text();
        const data = text ? (JSON.parse(text) as T) : null;
        return { ok: true, status: response.status, data, headers: response.headers };
      } catch (error) {
        log.warn("supabase_rest_failed", { table, role, failure: "parse", error });
        return { ok: false, status: 502, failure: "parse" };
      }
    },
  };
}
