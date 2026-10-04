import { describe, expect, it } from "vitest";
import { HOTLINES, LEGAL_LINKS, QUICK_LINKS, SAFETY_TIPS, SCAM_TYPES, telHref } from "@/lib/domain/content";
import { isVideoId } from "@/lib/domain/feeds";
import { findVideo, videoHref } from "@/lib/domain/feed-view";
import type { VideoItem } from "@/lib/domain/types";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/domain/validation";

const sample: VideoItem = {
  id: "abcdefghi01",
  title: "영상",
  thumbnail: "https://i.ytimg.com/vi/abcdefghi01/hqdefault.jpg",
  description: "",
  suspiciousUrl: "",
  channel: "채널",
};

describe("telHref", () => {
  it("숫자만 남겨 전화 링크를 만든다", () => {
    expect(telHref("112")).toBe("tel:112");
    expect(telHref("1566-1188")).toBe("tel:15661188");
    expect(telHref("javascript:alert(1)")).toBe("tel:1");
  });

  it("신고 전화는 모두 숫자 번호다", () => {
    for (const line of HOTLINES) expect(line.number).toMatch(/^\d{3,4}$/);
  });
});

describe("홈 고정 문구", () => {
  it("사기 수법 질문은 채팅 길이 제한 안에 있다", () => {
    for (const scam of SCAM_TYPES) {
      expect(scam.question.length).toBeLessThanOrEqual(MAX_CHAT_MESSAGE_LENGTH);
      expect(scam.question.trim()).not.toBe("");
    }
    expect(new Set(SCAM_TYPES.map((scam) => scam.id)).size).toBe(SCAM_TYPES.length);
  });

  it("보안 수칙은 소식 칸 4개를 채우고 질문이 길이 제한 안에 있다", () => {
    expect(SAFETY_TIPS.length).toBeGreaterThanOrEqual(4);
    for (const tip of SAFETY_TIPS) {
      expect(tip.question.length).toBeLessThanOrEqual(MAX_CHAT_MESSAGE_LENGTH);
      expect(tip.question.trim()).not.toBe("");
    }
    expect(new Set(SAFETY_TIPS.map((tip) => tip.title)).size).toBe(SAFETY_TIPS.length);
  });

  it("바로가기는 사이트 안 주소만 가리킨다", () => {
    for (const link of QUICK_LINKS) expect(link.href.startsWith("/")).toBe(true);
    expect(new Set(QUICK_LINKS.map((link) => link.href)).size).toBe(QUICK_LINKS.length);
  });

  it("약관 링크는 내부 경로다", () => {
    for (const link of LEGAL_LINKS) expect(link.href.startsWith("/")).toBe(true);
    expect(LEGAL_LINKS.map((link) => link.href)).toEqual(["/privacy", "/terms"]);
  });
});


describe("findVideo", () => {
  it("목록에 있는 올바른 id 만 찾는다", () => {
    expect(findVideo([sample], "abcdefghi01")).toBe(sample);
    expect(findVideo([sample], "abcdefghi02")).toBeNull();
    expect(findVideo([sample], null)).toBeNull();
    expect(findVideo([sample], "\"><script>")).toBeNull();
  });

  it("videoHref 는 /videos?v= 주소를 만든다", () => {
    expect(videoHref("abcdefghi01")).toBe("/videos?v=abcdefghi01");
    expect(isVideoId("abcdefghi01")).toBe(true);
    expect(isVideoId("short")).toBe(false);
  });
});
