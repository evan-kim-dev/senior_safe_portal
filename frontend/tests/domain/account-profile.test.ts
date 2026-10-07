import { describe, expect, it } from "vitest";
import {
  preferredNewsCategories,
  preferredVideoCategories,
  parseAccountProfileFromMeta,
  welfarePreferenceKeywords,
} from "@/lib/domain/account-profile";
import { mapVideos } from "@/lib/domain/feeds";

describe("preferredVideoCategories", () => {
  it("관심 주제를 앞에 두고 나이대 기본 순서를 뒤에 붙인다", () => {
    expect(
      preferredVideoCategories(
        { role: "senior", birthYear: 1940, interests: ["family"] },
        new Date("2026-10-06"),
      )[0],
    ).toBe("family");
  });

  it("보호자는 기본 순서를 쓴다", () => {
    expect(
      preferredVideoCategories(
        { role: "guardian", birthYear: null, interests: [] },
        new Date("2026-10-06"),
      ),
    ).toEqual(["scam", "smishing", "finance", "digital", "family"]);
  });
});

describe("preferredNewsCategories", () => {
  it("금융 관심이면 금융·사기 뉴스를 앞에 둔다", () => {
    const order = preferredNewsCategories(
      { role: "senior", birthYear: 1945, interests: ["finance"] },
      new Date("2026-10-07"),
    );
    expect(order.slice(0, 2)).toEqual(["finance", "scam"]);
  });
});

describe("welfarePreferenceKeywords", () => {
  it("어르신·금융 키워드를 포함한다", () => {
    const keys = welfarePreferenceKeywords(
      { role: "senior", birthYear: 1940, interests: ["finance"] },
      new Date("2026-10-07"),
    );
    expect(keys).toEqual(expect.arrayContaining(["기초연금", "금융"]));
  });
});

describe("parseAccountProfileFromMeta", () => {
  it("메타데이터에서 역할·출생연도·관심을 읽는다", () => {
    expect(
      parseAccountProfileFromMeta({
        account_role: "senior",
        birth_year: 1955,
        interests: ["scam", "bad", "digital"],
      }),
    ).toEqual({
      role: "senior",
      birthYear: 1955,
      interests: ["scam", "digital"],
    });
  });
});

describe("mapVideos preferredCategories", () => {
  it("선호 카테고리 영상을 먼저 번갈아 넣는다", () => {
    const video = (id: string) => ({ video_id: id, title: id, channel: "c", description: "" });
    const result = mapVideos(
      [
        { category_id: "scam", videos: [video("aaaaaaaaaaa")] },
        { category_id: "digital", videos: [video("bbbbbbbbbbb")] },
      ],
      { preferredCategories: ["digital", "scam"] },
    );
    expect(result.map((item) => item.id)).toEqual(["bbbbbbbbbbb", "aaaaaaaaaaa"]);
  });
});
