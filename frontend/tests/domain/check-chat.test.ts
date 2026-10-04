import { describe, expect, it } from "vitest";
import { extractLinkUrl } from "@/lib/domain/chat";
import { asAnalyzeLinkBody, toCheckSuccess } from "@/lib/domain/check";
import { toPublicMessage } from "@/lib/domain/sanitize";

describe("toCheckSuccess", () => {
  it("위험 판정을 화면 결과로 바꾼다", () => {
    const result = toCheckSuccess("https://youtu.be/x", {
      status: "위험",
      reason: "가짜 투자 영상입니다. 링크를 누르지 마세요. 추가 설명.",
      scraped: { title: " 수익 보장 ", url: "https://youtu.be/x" },
    });
    expect(result).toEqual({
      ok: true,
      url: "https://youtu.be/x",
      kind: "video",
      verdict: "danger",
      headline: "누르지 마세요",
      title: "수익 보장",
      reason: "가짜 투자 영상입니다. 링크를 누르지 마세요.",
    });
  });

  it("판정이 안전/위험이 아니면 null (실패로 처리)", () => {
    expect(toCheckSuccess("https://a.com", { status: "주의" })).toBeNull();
    expect(toCheckSuccess("https://a.com", {})).toBeNull();
  });

  it("scraped.url 이 없으면 요청 주소를 쓴다", () => {
    expect(toCheckSuccess("https://a.com", { status: "안전", reason: "" })?.url).toBe("https://a.com");
  });

  it("객체가 아닌 응답은 받지 않는다", () => {
    expect(asAnalyzeLinkBody([])).toBeNull();
    expect(asAnalyzeLinkBody("x")).toBeNull();
  });
});

describe("toPublicMessage", () => {
  it("키·내부 정보가 섞인 문장은 숨긴다", () => {
    expect(toPublicMessage("GEMINI_API_KEY missing", "기본")).toBe("기본");
    expect(toPublicMessage("Bearer eyJ...", "기본")).toBe("기본");
    expect(toPublicMessage(undefined, "기본")).toBe("기본");
  });

  it("평범한 문장은 줄여서 보여 준다", () => {
    expect(toPublicMessage("  내부 네트워크   주소는 분석할 수 없습니다. ", "기본")).toBe("내부 네트워크 주소는 분석할 수 없습니다.");
    expect(toPublicMessage("가".repeat(300), "기본", 120)).toHaveLength(120);
  });
});

describe("extractLinkUrl", () => {
  it("분석 결과 → 질문 → 답 순서로 찾는다", () => {
    expect(extractLinkUrl({ url: "https://a.com" }, "", "")).toBe("https://a.com");
    expect(extractLinkUrl([{ url: "https://b.com" }], "", "")).toBe("https://b.com");
    expect(extractLinkUrl(null, "이거 https://c.com/x).", "답")).toBe("https://c.com/x");
    expect(extractLinkUrl(null, "질문", "답")).toBe("");
  });
});
