import { describe, expect, it } from "vitest";
import {
  cacheUrlKey,
  classifyKind,
  extractHttpUrl,
  extractRawHttpUrls,
  isCheckableAddress,
  normalizeSubmittedUrl,
  titleFromUrl,
  toTwoLineReason,
  tryCacheUrlKey,
} from "@/lib/domain/url";

describe("extractHttpUrl", () => {
  it("글 속 첫 주소를 꺼내고 끝 문장부호를 뗀다", () => {
    expect(extractHttpUrl("여기 보세요 https://example.com/a), 감사")).toBe("https://example.com/a");
  });

  it("주소가 없으면 null", () => {
    expect(extractHttpUrl("안녕하세요")).toBeNull();
  });
});

describe("extractRawHttpUrls", () => {
  it("적힌 그대로 모든 주소를 돌려준다", () => {
    expect(extractRawHttpUrls("a https://x.com b http://y.kr/p;")).toEqual(["https://x.com", "http://y.kr/p"]);
  });
});

describe("normalizeSubmittedUrl", () => {
  it("빈 값과 공백이 섞인 비주소는 null", () => {
    expect(normalizeSubmittedUrl("   ")).toBeNull();
    expect(normalizeSubmittedUrl("그냥 메모")).toBeNull();
  });

  it("도메인만 적어도 그대로 넘긴다", () => {
    expect(normalizeSubmittedUrl(" naver.com ")).toBe("naver.com");
  });
});

describe("isCheckableAddress", () => {
  it.each([
    ["https://example.com", true],
    ["example.co.kr/path", true],
    ["문자 내용 https://bit.ly/abc", true],
    ["엄마 생신 선물", false],
    ["hello", false],
  ])("%s → %s", (input, expected) => {
    expect(isCheckableAddress(input)).toBe(expected);
  });
});

describe("cacheUrlKey", () => {
  it("www·끝 슬래시·해시를 무시하고 같은 키를 만든다", () => {
    expect(cacheUrlKey("https://www.Example.com/a/#top")).toBe("https://example.com/a");
    expect(cacheUrlKey("example.com/a")).toBe("https://example.com/a");
  });

  it("주소가 아니면 tryCacheUrlKey 는 null", () => {
    expect(tryCacheUrlKey("http://")).toBeNull();
  });
});

describe("classifyKind", () => {
  it.each([
    ["https://youtu.be/abc", "video"],
    ["https://m.youtube.com/watch?v=1", "video"],
    ["https://youtube.com.evil.kr/watch", "link"],
    ["not a url", "link"],
  ])("%s → %s", (input, expected) => {
    expect(classifyKind(input)).toBe(expected);
  });
});

describe("toTwoLineReason", () => {
  it("앞 두 문장만 남긴다", () => {
    expect(toTwoLineReason("하나. 둘! 셋?")).toBe("하나. 둘!");
  });

  it("비어 있으면 안내 문장", () => {
    expect(toTwoLineReason("  ")).toBe("이유를 확인하지 못했습니다. 주소를 다시 검사해 주세요.");
  });
});

describe("titleFromUrl", () => {
  it("제목이 있으면 80자까지", () => {
    expect(titleFromUrl("https://a.com", "가".repeat(100))).toHaveLength(80);
  });

  it("제목이 없으면 호스트, 주소도 아니면 '주소'", () => {
    expect(titleFromUrl("https://www.a.com/x")).toBe("a.com");
    expect(titleFromUrl("???")).toBe("주소");
  });
});
