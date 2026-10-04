import { describe, expect, it, vi } from "vitest";
import { parseServerEnv } from "@/lib/server/env";
import { createEdgeFunctionGateway } from "@/lib/server/gateways/edge-functions";
import { createLogger, redact } from "@/lib/server/logger";
import { createLinkCheckRepository } from "@/lib/server/repositories/link-check-repository";
import { createRestClient } from "@/lib/server/supabase/rest-client";

const silent = createLogger({}, () => undefined, "error");
const env = parseServerEnv({
  SUPABASE_URL: "https://proj.supabase.co/",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
});

describe("parseServerEnv", () => {
  it("https 주소만 받고 끝 슬래시를 뗀다", () => {
    expect(env.supabaseUrl).toBe("https://proj.supabase.co");
    expect(parseServerEnv({ SUPABASE_URL: "http://evil.example" }).supabaseUrl).toBeNull();
    expect(parseServerEnv({ SUPABASE_URL: "http://127.0.0.1:54321" }).supabaseUrl).toBe("http://127.0.0.1:54321");
  });

  it("서버 값이 없으면 NEXT_PUBLIC 값을 쓴다", () => {
    const parsed = parseServerEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://p.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "k" });
    expect(parsed).toMatchObject({ supabaseUrl: "https://p.supabase.co", anonKey: "k", serviceRoleKey: null, logLevel: "info" });
  });
});

describe("redact", () => {
  it("키 이름과 토큰 모양 값을 가린다", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZSJ9.abcdefghijklmnop";
    expect(redact({ Authorization: "Bearer x", familyCode: "abc", note: `token ${jwt}`, nested: { apikey: "k" } })).toEqual({
      Authorization: "[redacted]",
      familyCode: "[redacted]",
      note: "token [redacted]",
      nested: { apikey: "[redacted]" },
    });
  });

  it("에러는 이름과 메시지만 남긴다", () => {
    const result = redact(new TypeError("AIzaSyA1234567890123456789012 failed")) as Record<string, unknown>;
    expect(result.name).toBe("TypeError");
    expect(result.message).toBe("[redacted] failed");
  });

  it("순환·깊은 객체에서도 멈춘다", () => {
    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let index = 0; index < 10; index += 1) {
      cursor.next = {};
      cursor = cursor.next as Record<string, unknown>;
    }
    expect(JSON.stringify(redact(deep))).toContain("[truncated]");
  });
});

describe("rest client", () => {
  it("역할에 맞는 키를 붙이고 실패는 failure 로 돌려준다", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
    const client = createRestClient(env, silent, fetchImpl as unknown as typeof fetch);
    const result = await client.request("service", { path: "link_checks?select=url" });
    expect(result).toEqual({ ok: false, status: 500, failure: "http" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://proj.supabase.co/rest/v1/link_checks?select=url");
    expect(new Headers(init.headers).get("apikey")).toBe("service");
    expect(init.cache).toBe("no-store");
  });

  it("키가 없으면 요청하지 않는다", async () => {
    const fetchImpl = vi.fn();
    const client = createRestClient(parseServerEnv({ SUPABASE_URL: "https://p.supabase.co", SUPABASE_ANON_KEY: "a" }), silent, fetchImpl);
    expect(await client.request("service", { path: "activity" })).toEqual({ ok: false, status: 503, failure: "missing-config" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("공개 피드는 데이터 캐시를 쓴다", async () => {
    const fetchImpl = vi.fn(async () => Response.json([{ videos: [] }]));
    const client = createRestClient(env, silent, fetchImpl as unknown as typeof fetch);
    const result = await client.request("anon", { path: "youtube_feeds?select=videos", revalidateSeconds: 300, tags: ["youtube_feeds"] });
    expect(result.ok && result.data).toEqual([{ videos: [] }]);
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit & { next?: unknown }];
    expect(init.cache).toBe("force-cache");
    expect(init.next).toEqual({ revalidate: 300, tags: ["youtube_feeds"] });
  });
});

describe("link check repository", () => {
  it("6시간 안의 기록만 DB 에서 고른다", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json([{ url: "https://a.com", kind: "link", verdict: "safe", title: "A", reason: "r" }]),
    );
    const repo = createLinkCheckRepository(createRestClient(env, silent, fetchImpl as unknown as typeof fetch));
    const found = await repo.findFresh("https://a.com/", new Date("2026-10-05T12:00:00Z"));
    expect(found).toMatchObject({ ok: true, verdict: "safe", headline: "괜찮아요" });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(decodeURIComponent(url)).toContain("checked_at=gte.2026-10-05T06:00:00.000Z");
  });

  it("판정 값이 이상한 기록은 버린다", async () => {
    const fetchImpl = vi.fn(async () => Response.json([{ url: "https://a.com", verdict: "maybe" }]));
    const repo = createLinkCheckRepository(createRestClient(env, silent, fetchImpl as unknown as typeof fetch));
    expect(await repo.findFresh("k")).toBeNull();
  });
});

describe("edge function gateway", () => {
  it("내부 비밀값이 있으면 헤더로 보낸다", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ reply: "hi" }));
    const gateway = createEdgeFunctionGateway(
      parseServerEnv({ SUPABASE_URL: "https://p.supabase.co", SUPABASE_ANON_KEY: "a", EDGE_INTERNAL_SECRET: "s3cret" }),
      silent,
      fetchImpl as unknown as typeof fetch,
    );
    expect(await gateway.invoke("chat-agent", { message: "x" }, 1000)).toEqual({ kind: "response", ok: true, status: 200, data: { reply: "hi" } });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["x-internal-secret"]).toBe("s3cret");
  });

  it("시간 초과와 연결 실패를 나눈다", async () => {
    const timeout = Object.assign(new Error("t"), { name: "TimeoutError" });
    const gateway = createEdgeFunctionGateway(env, silent, vi.fn(async () => Promise.reject(timeout)) as unknown as typeof fetch);
    expect(await gateway.invoke("analyze-link", {}, 10)).toEqual({ kind: "timeout" });
    const broken = createEdgeFunctionGateway(env, silent, vi.fn(async () => Promise.reject(new TypeError("fetch failed"))) as unknown as typeof fetch);
    expect(await broken.invoke("analyze-link", {}, 10)).toEqual({ kind: "network" });
  });
});
