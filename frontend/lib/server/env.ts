import "server-only";
import type { LogLevel } from "./logger";

export type ServerEnv = {
  supabaseUrl: string | null;
  anonKey: string | null;
  serviceRoleKey: string | null;
  edgeInternalSecret: string | null;
  cronSecret: string | null;
  logLevel: LogLevel;
};

type EnvSource = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** https 주소만 받는다. 로컬 Supabase(http://127.0.0.1:54321)는 예외. */
function normalizeBaseUrl(value: string | undefined): string | null {
  const raw = nonEmpty(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol === "https:") return url.origin;
    if (url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname)) return url.origin;
    return null;
  } catch {
    return null;
  }
}

function logLevelOf(value: string | undefined): LogLevel {
  return value === "debug" || value === "info" || value === "warn" || value === "error" ? value : "info";
}

export function parseServerEnv(source: EnvSource): ServerEnv {
  return {
    supabaseUrl: normalizeBaseUrl(source.SUPABASE_URL ?? source.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: nonEmpty(source.SUPABASE_ANON_KEY ?? source.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: nonEmpty(source.SUPABASE_SERVICE_ROLE_KEY),
    // Vercel: EDGE_INTERNAL_SECRET / Supabase Edge: INTERNAL_API_SECRET — 값만 같으면 된다.
    edgeInternalSecret: nonEmpty(source.EDGE_INTERNAL_SECRET ?? source.INTERNAL_API_SECRET),
    // Vercel Cron · Supabase refresh-* Edge Function 과 같은 값.
    cronSecret: nonEmpty(source.CRON_SECRET),
    logLevel: logLevelOf(source.LOG_LEVEL),
  };
}

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
