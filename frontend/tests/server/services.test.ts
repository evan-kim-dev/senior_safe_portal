import { describe, expect, it, vi } from "vitest";
import { MESSAGES } from "@/lib/domain/messages";
import type { CheckSuccess } from "@/lib/domain/types";
import type { EdgeResult } from "@/lib/server/gateways/edge-functions";
import { createLogger } from "@/lib/server/logger";
import { createActivityService } from "@/lib/server/services/activity-service";
import { createChatService } from "@/lib/server/services/chat-service";
import { createCheckService, type CheckServiceDeps } from "@/lib/server/services/check-service";
import { createFeedService } from "@/lib/server/services/feed-service";

const FAMILY = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
const silent = createLogger({}, () => undefined, "error");

function response(data: Record<string, unknown>, ok = true, status = 200): EdgeResult {
  return { kind: "response", ok, status, data };
}

function setup(overrides: Partial<CheckServiceDeps> = {}) {
  const deferred: Array<() => Promise<void>> = [];
  const deps: CheckServiceDeps = {
    findFresh: vi.fn(async () => null),
    analyze: vi.fn(async () => response({ status: "안전", reason: "공식 사이트입니다.", scraped: { url: "https://a.com/", title: "A" } })),
    save: vi.fn(async () => undefined),
    recordDanger: vi.fn(async () => undefined),
    defer: (task) => {
      deferred.push(task);
    },
    log: silent,
    ...overrides,
  };
  return { deps, deferred, service: createCheckService(deps) };
}

const dangerVideo: CheckSuccess = {
  ok: true,
  url: "https://youtu.be/abc",
  kind: "video",
  verdict: "danger",
  headline: "누르지 마세요",
  title: "영상",
  reason: "사기입니다.",
};

describe("check service", () => {
  it("캐시가 있으면 Gemini 를 부르지 않는다", async () => {
    const { deps, service } = setup({ findFresh: vi.fn(async () => dangerVideo) });
    const outcome = await service.check({ url: "https://youtu.be/abc", familyCode: "" });
    expect(outcome).toEqual({ status: 200, body: dangerVideo });
    expect(deps.analyze).not.toHaveBeenCalled();
  });

  it("새로 검사한 결과는 응답 뒤에 저장한다", async () => {
    const { deps, deferred, service } = setup();
    const outcome = await service.check({ url: "a.com", familyCode: "" });
    expect(outcome.status).toBe(200);
    expect(outcome.body.ok && outcome.body.headline).toBe("괜찮아요");
    expect(deps.save).not.toHaveBeenCalled();
    await Promise.all(deferred.map((task) => task()));
    expect(deps.save).toHaveBeenCalledWith("https://a.com/", expect.objectContaining({ verdict: "safe" }));
  });

  it("위험 영상은 캐시에서 나와도 가족 집계에 넣는다", async () => {
    const { deps, deferred, service } = setup({ findFresh: vi.fn(async () => dangerVideo) });
    await service.check({ url: "https://youtu.be/abc", familyCode: FAMILY, userId: "user-1" });
    await Promise.all(deferred.map((task) => task()));
    expect(deps.recordDanger).toHaveBeenCalledWith(FAMILY, "danger_video", "user-1", expect.any(String));
  });

  it("같은 주소를 동시에 눌러도 분석은 한 번", async () => {
    let release: (value: EdgeResult) => void = () => undefined;
    const analyze = vi.fn(() => new Promise<EdgeResult>((resolve) => (release = resolve)));
    const { service } = setup({ analyze });
    const first = service.check({ url: "https://a.com", familyCode: "" });
    const second = service.check({ url: "https://www.a.com/", familyCode: "" });
    await vi.waitFor(() => expect(analyze).toHaveBeenCalledTimes(1));
    release(response({ status: "안전", reason: "" }));
    const [a, b] = await Promise.all([first, second]);
    expect(a).toEqual(b);
    expect(analyze).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ kind: "missing-config" } as EdgeResult, 503],
    [{ kind: "timeout" } as EdgeResult, 502],
    [{ kind: "network" } as EdgeResult, 502],
  ])("연결 실패(%o)는 %i 와 기본 문장", async (result, status) => {
    const { service } = setup({ analyze: vi.fn(async () => result) });
    expect(await service.check({ url: "https://a.com", familyCode: "" })).toEqual({
      status,
      body: { ok: false, message: MESSAGES.checkFailed },
    });
  });

  it("Edge Function 의 안내 문장은 걸러서 전한다", async () => {
    const { service } = setup({
      analyze: vi.fn(async () => response({ message: "내부 네트워크 주소는 분석할 수 없습니다." }, false, 400)),
    });
    expect(await service.check({ url: "http://10.0.0.1", familyCode: "" })).toEqual({
      status: 400,
      body: { ok: false, message: "내부 네트워크 주소는 분석할 수 없습니다." },
    });
  });

  it("판정이 애매하면 안전으로 보지 않고 실패로 돌린다", async () => {
    const { service } = setup({ analyze: vi.fn(async () => response({ status: "모름" })) });
    expect(await service.check({ url: "https://a.com", familyCode: "" })).toEqual({
      status: 502,
      body: { ok: false, message: MESSAGES.checkFailed },
    });
  });

  it("캐시 읽기가 터져도 검사는 계속한다", async () => {
    const { deps, service } = setup({ findFresh: vi.fn(async () => Promise.reject(new Error("db down"))) });
    expect((await service.check({ url: "https://a.com", familyCode: "" })).status).toBe(200);
    expect(deps.analyze).toHaveBeenCalledTimes(1);
  });
});

describe("chat service", () => {
  const input = { message: "이 문자 https://x.kr 괜찮아요?", history: [] };

  it("답과 검사할 주소를 돌려준다", async () => {
    const service = createChatService({ ask: async () => response({ reply: " 누르지 마세요. ", linkAnalysis: null }) });
    expect(await service.ask(input)).toEqual({ status: 200, body: { ok: true, reply: "누르지 마세요.", linkUrl: "https://x.kr" } });
  });

  it("빈 답은 502", async () => {
    const service = createChatService({ ask: async () => response({ reply: "" }) });
    expect(await service.ask(input)).toEqual({ status: 502, body: { ok: false, message: MESSAGES.chatNoReply } });
  });

  it("설정이 없으면 503", async () => {
    const service = createChatService({ ask: async () => ({ kind: "missing-config" }) });
    expect((await service.ask(input)).status).toBe(503);
  });

  it("어르신 위험 상담은 danger_chat 으로 남긴다", async () => {
    const deferred: Array<() => Promise<void>> = [];
    const recordChatDanger = vi.fn(async () => undefined);
    const service = createChatService({
      ask: async () => response({ reply: "스미싱입니다. 링크를 누르지 마세요.", linkAnalysis: null }),
      recordChatDanger,
      defer: (task) => {
        deferred.push(task);
      },
    });
    await service.ask(input, { userId: "user-1", familyCode: FAMILY });
    expect(recordChatDanger).not.toHaveBeenCalled();
    await Promise.all(deferred.map((task) => task()));
    expect(recordChatDanger).toHaveBeenCalledWith(FAMILY, "user-1", expect.stringContaining("문자"));
  });

  it("챗에 포함된 링크가 위험 판정이면 danger_chat 은 생략한다", async () => {
    const deferred: Array<() => Promise<void>> = [];
    const recordChatDanger = vi.fn(async () => undefined);
    const danger = {
      ok: true as const,
      url: "https://x.kr",
      kind: "link" as const,
      verdict: "danger" as const,
      headline: "누르지 마세요" as const,
      title: "X",
      reason: "피싱",
    };
    const service = createChatService({
      ask: async () => response({ reply: "누르지 마세요.", linkAnalysis: null }),
      checkLink: vi.fn(async () => ({ status: 200, body: danger })),
      recordChatDanger,
      defer: (task) => {
        deferred.push(task);
      },
    });
    await service.ask(input, { userId: "user-1", familyCode: FAMILY });
    await Promise.all(deferred.map((task) => task()));
    expect(recordChatDanger).not.toHaveBeenCalled();
  });
});

describe("feed service", () => {
  it("표를 읽지 못하면 빈 목록과 안내 문장", async () => {
    const service = createFeedService({
      videoRows: async () => null,
      newsRows: async () => null,
      welfarePayload: async () => null,
    });
    expect(await service.videos("")).toEqual({ ok: true, videos: [], message: MESSAGES.emptyFeed });
    expect(await service.welfare({ region: "서울", category: "all" })).toEqual({ ok: true, place: "서울", cards: [], message: MESSAGES.emptyFeed });
  });

  it("복지는 지역|분류 키로 찾는다", async () => {
    const welfarePayload = vi.fn(async () => ({
      payload: { region: "서울", services: [{ servNm: "기초연금", target: "65세 이상" }] },
      updatedAt: "2026-10-07T12:00:00.000Z",
    }));
    const service = createFeedService({ videoRows: async () => [], newsRows: async () => [], welfarePayload });
    const result = await service.welfare({ region: "서울", category: "all" });
    expect(welfarePayload).toHaveBeenCalledWith("서울|all", { fresh: undefined });
    expect(result.cards).toHaveLength(1);
    expect(result.updatedAt).toBe("2026-10-07T12:00:00.000Z");
  });
});

describe("activity service", () => {
  it("가족 코드가 틀리면 DB 에 가지 않는다", async () => {
    const repo = {
      insert: vi.fn(async () => undefined),
      countBetween: vi.fn(async () => 3),
      sumDurationBetween: vi.fn(async () => 90),
      listBetween: vi.fn(async () => []),
    };
    const service = createActivityService(repo);
    await service.recordDangerVideo("nope");
    expect(await service.countDangerVideosToday("nope")).toBe(0);
    expect(await service.listDangerVideosToday("nope")).toEqual([]);
    expect(repo.insert).not.toHaveBeenCalled();
    expect(repo.countBetween).not.toHaveBeenCalled();
    expect(repo.listBetween).not.toHaveBeenCalled();
  });

  it("서울 하루 범위로 센다", async () => {
    const repo = {
      insert: vi.fn(async () => undefined),
      countBetween: vi.fn(async () => 3),
      sumDurationBetween: vi.fn(async () => 0),
      listBetween: vi.fn(async () => []),
    };
    const service = createActivityService(repo);
    expect(await service.countDangerVideosToday(FAMILY, new Date("2026-10-04T16:30:00Z"))).toBe(3);
    expect(repo.countBetween).toHaveBeenCalledWith(
      FAMILY,
      "2026-10-04T15:00:00.000Z",
      "2026-10-05T15:00:00.000Z",
      ["danger_video", "danger_link", "danger_chat"],
      undefined,
    );
  });

  it("오늘 활동 목록에 종류·요약 라벨을 붙인다", async () => {
    const repo = {
      insert: vi.fn(async () => undefined),
      countBetween: vi.fn(async () => 0),
      sumDurationBetween: vi.fn(async () => 0),
      listBetween: vi.fn(async () => [
        {
          id: "a1",
          created_at: "2026-10-04T16:30:00.000Z",
          kind: "danger_video" as const,
          summary: "의심 영상",
          duration_sec: 0,
          user_id: null,
        },
      ]),
    };
    const service = createActivityService(repo);
    const items = await service.listDangerVideosToday(FAMILY, new Date("2026-10-04T16:30:00Z"));
    expect(items).toEqual([
      {
        id: "a1",
        createdAt: "2026-10-04T16:30:00.000Z",
        kind: "danger_video",
        label: "01:30 위험한 영상 · 의심 영상",
      },
    ]);
  });
});
