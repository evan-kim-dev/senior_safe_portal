import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/lib/domain/messages";
import {
  isFamilyCode,
  MAX_CHAT_HISTORY,
  parseChatInput,
  parseCheckInput,
  parseFeedInput,
  parseWelfareInput,
  sanitizeHistory,
} from "@/lib/domain/validation";

const FAMILY = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

describe("parseCheckInput", () => {
  it("주소가 없으면 안내 문장", () => {
    expect(parseCheckInput({})).toEqual({ ok: false, message: MESSAGES.urlRequired });
    expect(parseCheckInput(null)).toEqual({ ok: false, message: MESSAGES.urlRequired });
    expect(parseCheckInput({ url: 3 })).toEqual({ ok: false, message: MESSAGES.urlRequired });
  });

  it("너무 긴 주소는 거절", () => {
    expect(parseCheckInput({ url: `https://a.com/${"x".repeat(3000)}` })).toEqual({ ok: false, message: MESSAGES.urlTooLong });
  });

  it("형식이 틀린 가족 코드는 비운다", () => {
    expect(parseCheckInput({ url: " https://a.com ", familyCode: "nope" })).toEqual({
      ok: true,
      value: { url: "https://a.com", familyCode: "" },
    });
    expect(parseCheckInput({ url: "a.com", familyCode: FAMILY })).toEqual({ ok: true, value: { url: "a.com", familyCode: FAMILY } });
  });
});

describe("isFamilyCode", () => {
  it("UUID 만 받는다", () => {
    expect(isFamilyCode(FAMILY)).toBe(true);
    expect(isFamilyCode(`${FAMILY}x`)).toBe(false);
    expect(isFamilyCode(42)).toBe(false);
  });
});

describe("sanitizeHistory", () => {
  it("역할이 틀린 항목을 버리고 최근 것만 남긴다", () => {
    const turns = Array.from({ length: 20 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: `${index}` }));
    const result = sanitizeHistory([...turns, { role: "system", content: "x" }, "bad", null]);
    expect(result).toHaveLength(MAX_CHAT_HISTORY);
    expect(result.at(-1)).toEqual({ role: "assistant", content: "19" });
  });

  it("배열이 아니면 빈 배열", () => {
    expect(sanitizeHistory("x")).toEqual([]);
  });
});

describe("parseChatInput", () => {
  it("빈 질문과 긴 질문을 거절", () => {
    expect(parseChatInput({ message: "  " })).toEqual({ ok: false, message: MESSAGES.chatEmpty });
    expect(parseChatInput({ message: "가".repeat(2001) })).toEqual({ ok: false, message: MESSAGES.chatTooLong });
  });
});

describe("parseFeedInput", () => {
  it("분류가 없으면 전체", () => {
    expect(parseFeedInput(null)).toEqual({ ok: true, value: { categoryId: "" } });
  });

  it("쿼리를 바꾸는 문자는 거절", () => {
    expect(parseFeedInput({ categoryId: "music&select=*" })).toEqual({ ok: false, message: MESSAGES.categoryInvalid });
  });
});

describe("parseWelfareInput", () => {
  it("지역이 없으면 안내 문장, category 기본값은 all", () => {
    expect(parseWelfareInput({})).toEqual({ ok: false, message: MESSAGES.welfareRegionRequired });
    expect(parseWelfareInput({ region: "서울 강남구" })).toEqual({ ok: true, value: { region: "서울 강남구", category: "all" } });
  });

  it("지역에 기호가 섞이면 거절", () => {
    expect(parseWelfareInput({ region: "서울|all" })).toEqual({ ok: false, message: MESSAGES.welfareBadRequest });
  });
});
