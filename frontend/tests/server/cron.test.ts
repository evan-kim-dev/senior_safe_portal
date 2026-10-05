import { describe, expect, it } from "vitest";
import { cronAuthorized, summarizeRefreshPayload } from "@/lib/server/cron/feeds";

describe("cronAuthorized", () => {
  it("Bearer 와 x-cron-secret 을 허용한다", () => {
    expect(cronAuthorized(new Request("https://x", { headers: { Authorization: "Bearer secret" } }), "secret")).toBe(true);
    expect(cronAuthorized(new Request("https://x", { headers: { "x-cron-secret": "secret" } }), "secret")).toBe(true);
  });

  it("틀린 값과 빈 값은 거절한다", () => {
    expect(cronAuthorized(new Request("https://x", { headers: { Authorization: "Bearer wrong" } }), "secret")).toBe(false);
    expect(cronAuthorized(new Request("https://x"), "secret")).toBe(false);
    expect(cronAuthorized(new Request("https://x", { headers: { Authorization: "Bearer secre" } }), "secret")).toBe(false);
  });
});

describe("summarizeRefreshPayload", () => {
  it("본문 전체를 노출하지 않고 요약만 남긴다", () => {
    expect(
      summarizeRefreshPayload("refresh-news-feeds", 200, {
        ok: true,
        refreshed: 5,
        total: 5,
        results: [{ articles: ["leak"] }],
      }),
    ).toEqual({
      name: "refresh-news-feeds",
      ok: true,
      status: 200,
      refreshed: 5,
      total: 5,
    });
  });
});
