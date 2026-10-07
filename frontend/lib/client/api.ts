export type ApiErrorKind = "timeout" | "network" | "parse" | "aborted";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;

  constructor(kind: ApiErrorKind, status = 0) {
    super(`api ${kind}${status ? ` ${status}` : ""}`);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

type RequestOptions = { timeoutMs?: number; signal?: AbortSignal; headers?: Record<string, string> };

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * 우리 API 는 실패해도 { ok:false, message } JSON 을 돌려주므로 상태 코드와 상관없이 본문을 넘긴다.
 * 연결 실패·시간 초과·JSON 이 아닌 응답만 ApiError 로 던진다.
 */
async function requestJson<T>(path: string, init: RequestInit, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const onAbort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    let response: Response;
    try {
      response = await fetch(path, { ...init, signal: controller.signal });
    } catch {
      if (timedOut) throw new ApiError("timeout");
      if (options.signal?.aborted) throw new ApiError("aborted");
      throw new ApiError("network");
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError("parse", response.status);
    }
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

export function postJson<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
  return requestJson<T>(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(body),
    },
    options,
  );
}

export function getJson<T>(path: string, options?: RequestOptions): Promise<T> {
  return requestJson<T>(path, { method: "GET", headers: { ...options?.headers } }, options);
}

type CacheEntry = { expiresAt: number; promise: Promise<unknown> };

const memo = new Map<string, CacheEntry>();

/** 수동 새로고침 때 같은 경로의 클라이언트 캐시를 비운다. */
export function invalidateCachedPosts(pathPrefix: string) {
  for (const key of memo.keys()) {
    if (key.startsWith(`${pathPrefix}:`)) memo.delete(key);
  }
}

/**
 * 같은 화면을 오가도 피드를 다시 받지 않게 잠깐 기억한다.
 * keep 이 false 를 돌려주는 응답(실패)은 기억하지 않는다.
 */
export function cachedPostJson<T>(
  path: string,
  body: unknown,
  ttlMs: number,
  keep: (data: T) => boolean,
  options?: RequestOptions & { cacheKey?: string; bypassCache?: boolean },
): Promise<T> {
  // cacheKey 가 있으면 body(refresh 등)와 무관하게 같은 항목으로 묶는다.
  const key =
    options?.cacheKey != null && options.cacheKey !== ""
      ? `${path}:${options.cacheKey}`
      : `${path}:${JSON.stringify(body)}`;
  const now = Date.now();
  if (!options?.bypassCache) {
    const hit = memo.get(key);
    if (hit && hit.expiresAt > now) return hit.promise as Promise<T>;
  } else {
    memo.delete(key);
  }

  const entry: CacheEntry = { expiresAt: now + ttlMs, promise: Promise.resolve() };
  const drop = () => {
    if (memo.get(key) === entry) memo.delete(key);
  };
  const requestOptions: RequestOptions = {
    timeoutMs: options?.timeoutMs,
    signal: options?.signal,
    headers: options?.headers,
  };
  const promise = postJson<T>(path, body, requestOptions).then(
    (data) => {
      if (!keep(data)) drop();
      return data;
    },
    (error: unknown) => {
      drop();
      throw error;
    },
  );
  entry.promise = promise;
  memo.set(key, entry);
  return promise;
}
