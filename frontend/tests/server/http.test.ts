import { describe, expect, it } from "vitest";
import { readJsonBody } from "@/lib/server/http/body";
import { clientIp } from "@/lib/server/http/client-ip";
import { RateLimiter } from "@/lib/server/http/rate-limit";

function post(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request("https://app.test/api", { method: "POST", body, headers, duplex: "half" } as RequestInit);
}

describe("readJsonBody", () => {
  it("JSON 을 읽는다", async () => {
    expect(await readJsonBody(post(JSON.stringify({ url: "a" })))).toEqual({ ok: true, value: { url: "a" } });
  });

  it("JSON 이 아니거나 비어 있으면 invalid-json", async () => {
    expect(await readJsonBody(post("{"))).toEqual({ ok: false, reason: "invalid-json" });
    expect(await readJsonBody(new Request("https://app.test/api", { method: "POST" }))).toEqual({ ok: false, reason: "invalid-json" });
  });

  it("선언된 길이가 크면 읽기 전에 거절", async () => {
    expect(await readJsonBody(post("{}", { "content-length": "999999" }), 100)).toEqual({ ok: false, reason: "too-large" });
  });

  it("길이를 속여도 실제로 읽은 바이트로 거절", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let index = 0; index < 10; index += 1) controller.enqueue(new Uint8Array(50).fill(32));
        controller.close();
      },
    });
    expect(await readJsonBody(post(stream), 200)).toEqual({ ok: false, reason: "too-large" });
  });

  it("한글이 여러 조각으로 나뉘어도 깨지지 않는다", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ message: "안녕하세요" }));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      },
    });
    expect(await readJsonBody(post(stream))).toEqual({ ok: true, value: { message: "안녕하세요" } });
  });
});

describe("clientIp", () => {
  it("x-real-ip 를 먼저, 없으면 x-forwarded-for 첫 값", () => {
    expect(clientIp(new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-forwarded-for": "3.3.3.3, 10.0.0.1" }))).toBe("3.3.3.3");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("RateLimiter", () => {
  it("창 안에서 limit 을 넘으면 막고, 창이 지나면 풀린다", () => {
    let now = 0;
    const limiter = new RateLimiter({ limit: 2, windowMs: 1000 }, () => now);
    expect(limiter.hit("ip").allowed).toBe(true);
    expect(limiter.hit("ip").allowed).toBe(true);
    const blocked = limiter.hit("ip");
    expect(blocked).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 1 });
    expect(limiter.hit("other").allowed).toBe(true);
    now = 1000;
    expect(limiter.hit("ip").allowed).toBe(true);
  });

  it("키가 너무 많아지면 오래된 것부터 지워 메모리가 늘지 않는다", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 60_000 }, () => 0, 100);
    for (let index = 0; index < 1000; index += 1) limiter.hit(`ip-${index}`);
    expect(limiter.size).toBeLessThanOrEqual(100);
  });

  it("잘못된 규칙은 만들 수 없다", () => {
    expect(() => new RateLimiter({ limit: 0, windowMs: 1 })).toThrow(RangeError);
  });
});
