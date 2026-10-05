import { describe, expect, it } from "vitest";
import {
  buildSeniorRoster,
  filterActivityBySenior,
  seniorRosterSummaryLine,
  sortSeniorRoster,
} from "@/lib/domain/senior-roster";

describe("buildSeniorRoster", () => {
  it("위험 있는 어르신을 앞에 두고 요약을 채운다", () => {
    const roster = buildSeniorRoster(
      [
        { userId: "a", displayName: "김영희" },
        { userId: "b", displayName: "이철수" },
        { userId: "c", displayName: "박순자" },
      ],
      [
        {
          userId: "b",
          kind: "news_view",
          createdAt: "2026-10-06T02:00:00.000Z",
          label: "11:00 기사 열람",
        },
        {
          userId: "a",
          kind: "danger_link",
          createdAt: "2026-10-06T03:00:00.000Z",
          label: "12:00 위험한 링크",
        },
        {
          userId: "a",
          kind: "video_watch",
          createdAt: "2026-10-06T01:00:00.000Z",
          durationSec: 120,
        },
      ],
    );

    expect(roster.map((item) => item.userId)).toEqual(["a", "b", "c"]);
    expect(roster[0]).toMatchObject({
      displayName: "김영희",
      dangerCount: 1,
      watchSec: 120,
      status: "attention",
    });
    expect(roster[1].status).toBe("active");
    expect(roster[2].status).toBe("quiet");
    expect(seniorRosterSummaryLine(roster[0])).toContain("위험 1");
  });
});

describe("sortSeniorRoster", () => {
  it("상태 우선순위를 지킨다", () => {
    const sorted = sortSeniorRoster([
      {
        userId: "1",
        displayName: "가",
        dangerCount: 0,
        newsCount: 0,
        watchSec: 0,
        status: "quiet",
      },
      {
        userId: "2",
        displayName: "나",
        dangerCount: 2,
        newsCount: 0,
        watchSec: 0,
        status: "attention",
      },
    ]);
    expect(sorted[0].userId).toBe("2");
  });
});

describe("filterActivityBySenior", () => {
  it("선택한 어르신 활동만 남긴다", () => {
    const items = [
      { id: "1", createdAt: "", kind: "news_view" as const, label: "a", userId: "a" },
      { id: "2", createdAt: "", kind: "news_view" as const, label: "b", userId: "b" },
    ];
    expect(filterActivityBySenior(items, "a")).toHaveLength(1);
    expect(filterActivityBySenior(items, null)).toHaveLength(2);
  });
});
