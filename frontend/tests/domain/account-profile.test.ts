import { describe, expect, it } from "vitest";
import {
  preferredVideoCategories,
  parseAccountProfileFromMeta,
} from "@/lib/domain/account-profile";
import { mapVideos } from "@/lib/domain/feeds";

describe("preferredVideoCategories", () => {
  it("관심 주제를 앞에 두고 나이대 기본 순서를 뒤에 붙인다", () => {
    expect(
      preferredVideoCategories(
        { role: "senior", birthYear: 1940, interests: ["history"] },
        new Date("2026-10-06"),
      )[0],
    ).toBe("history");
  });

  it("관리자는 기본 순서를 쓴다", () => {
    expect(
      preferredVideoCategories(
        { role: "guardian", birthYear: null, interests: [] },
        new Date("2026-10-06"),
      ),
    ).toEqual(["music", "affairs", "history", "entertainment", "health"]);
  });
});

describe("parseAccountProfileFromMeta", () => {
  it("메타데이터에서 역할·출생연도·관심을 읽는다", () => {
    expect(
      parseAccountProfileFromMeta({
        account_role: "senior",
        birth_year: 1955,
        interests: ["music", "bad", "health"],
      }),
    ).toEqual({
      role: "senior",
      birthYear: 1955,
      interests: ["music", "health"],
    });
  });
});

describe("mapVideos preferredCategories", () => {
  it("선호 카테고리 영상을 먼저 번갈아 넣는다", () => {
    const video = (id: string) => ({ video_id: id, title: id, channel: "c", description: "" });
    const result = mapVideos(
      [
        { category_id: "music", videos: [video("aaaaaaaaaaa")] },
        { category_id: "health", videos: [video("bbbbbbbbbbb")] },
      ],
      { preferredCategories: ["health", "music"] },
    );
    expect(result.map((item) => item.id)).toEqual(["bbbbbbbbbbb", "aaaaaaaaaaa"]);
  });
});
