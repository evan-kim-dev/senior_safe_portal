import { describe, expect, it } from "vitest";
import { extractLinkUrl } from "@/lib/domain/chat";
import { toCheckSuccess } from "@/lib/domain/check";
import { toPublicMessage } from "@/lib/domain/sanitize";

describe("toCheckSuccess", () => {
  it("위험 판정을 화면 결과로 바꾼다", () => {
    expect(
      toCheckSuccess("https://youtu.be/abcdefghijk", {
        status: "위험",
        reason: "가짜 이벤트입니다. 개인정보를 노립니다. 누르지 마세요.",
        scraped: { title: "당첨", url: "https://youtu.be/abcdefghijk" },
      }),
    ).toEqual({
      ok: true,
      url: "https://youtu.be/abcdefghijk",
      kind: "video",
      verdict: "danger",
      headline: "누르지 마세요",
      title: "당첨",
      reason: "가짜 이벤트입니다. 개인정보를 노립니다.",
    });
  });

  it("안전/위험이 아닌 판정은 실패", () => {
    expect(toCheckSuccess("https://a.com", { status: "주의" })).toBeNull();
    expect(toCheckSuccess("https://a.com", {})).toBeNull();
  });
});

describe("toPublicMessage", () => {
  it("키·내부 정보가 섞인 문장은 대체 문장으로 바꾼다", () => {
    expect(toPublicMessage("GEMINI_API_KEY missing", "대체")).toBe("대체");
    expect(toPublicMessage("Bearer eyJabc", "대체")).toBe("대체");
    expect(toPublicMessage(42, "대체")).toBe("대체");
  });

  it("평범한 문장은 길이만 자른다", () => {
    expect(toPublicMessage("내부 네트워크 주소는 분석할 수 없습니다.", "대체", 10)).toBe("내부 네트워크 주소");
  });
});

describe("extractLinkUrl", () => {
  it("분석 결과 → 질문·답 순서로 찾는다", () => {
    expect(extractLinkUrl({ url: "https://a.com" }, "", "")).toBe("https://a.com");
    expect(extractLinkUrl([{ url: "https://b.com" }], "", "")).toBe("https://b.com");
    expect(extractLinkUrl(null, "이거 https://c.com/x).", "답")).toBe("https://c.com/x");
    expect(extractLinkUrl(null, "주소 없음", "답")).toBe("");
  });
});
