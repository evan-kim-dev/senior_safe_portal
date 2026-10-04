import "server-only";
import type { ServerEnv } from "../env";
import type { Logger } from "../logger";

export type EdgeFunctionName = "analyze-link" | "chat-agent";

export type EdgeResult =
  | { kind: "response"; ok: boolean; status: number; data: Record<string, unknown> | null }
  | { kind: "missing-config" }
  | { kind: "timeout" }
  | { kind: "network" };

export type EdgeFunctionGateway = {
  invoke(name: EdgeFunctionName, body: unknown, timeoutMs: number): Promise<EdgeResult>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/** Supabase Edge Function 을 서버에서만 부른다. 브라우저는 이 경로를 모른다. */
export function createEdgeFunctionGateway(env: ServerEnv, log: Logger, fetchImpl: typeof fetch = fetch): EdgeFunctionGateway {
  return {
    async invoke(name, body, timeoutMs) {
      if (!env.supabaseUrl || !env.anonKey) {
        log.error("edge_function_missing_config", { function: name });
        return { kind: "missing-config" };
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.anonKey}`,
        apikey: env.anonKey,
      };
      if (env.edgeInternalSecret) headers["x-internal-secret"] = env.edgeInternalSecret;

      const started = Date.now();
      let response: Response;
      try {
        response = await fetchImpl(`${env.supabaseUrl}/functions/v1/${name}`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
          cache: "no-store",
        });
      } catch (error) {
        const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
        log.warn("edge_function_failed", { function: name, failure: timedOut ? "timeout" : "network", durationMs: Date.now() - started, error });
        return { kind: timedOut ? "timeout" : "network" };
      }

      let data: Record<string, unknown> | null = null;
      try {
        data = asRecord(await response.json());
      } catch {
        data = null;
      }

      if (!response.ok) {
        log.warn("edge_function_failed", { function: name, failure: "http", status: response.status, durationMs: Date.now() - started });
      }
      return { kind: "response", ok: response.ok, status: response.status, data };
    },
  };
}
