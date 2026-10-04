import "server-only";

const EMPTY = "아직 저장된 내용이 없습니다. 나중에 다시 열어 주세요.";

function restConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;
  return { supabaseUrl, anonKey };
}

function withKey(key: string, extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  return headers;
}

export async function readFeedRows<T>(path: string): Promise<T[] | null> {
  const config = restConfig();
  if (!config) return null;

  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    headers: withKey(config.anonKey),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as T[];
  return Array.isArray(rows) ? rows : null;
}

export const EMPTY_FEED_MESSAGE = EMPTY;

function serviceRestConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return { supabaseUrl, serviceKey };
}

export async function serviceFetch(path: string, init: RequestInit = {}): Promise<Response | null> {
  const config = serviceRestConfig();
  if (!config) return null;
  return fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: withKey(config.serviceKey, init.headers),
    cache: "no-store",
  });
}
