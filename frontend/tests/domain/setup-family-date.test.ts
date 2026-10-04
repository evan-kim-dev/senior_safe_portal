import { describe, expect, it } from "vitest";
import { boardAuthorId, parseBoardDraft } from "@/lib/domain/board";
import { seoulDayRange } from "@/lib/domain/date";
import { buildFamilyLinks } from "@/lib/domain/family";
import { MESSAGES } from "@/lib/domain/messages";
import { buildSetupLink, parseSetupHash } from "@/lib/domain/setup";

const FAMILY = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

describe("setup link", () => {
  it("만든 QR 주소를 그대로 다시 읽는다", () => {
    const payload = { name: "엄마", phone: "01012345678", textSize: "large" as const, channels: ["KBS"], familyCode: FAMILY };
    const link = buildSetupLink("https://app.example", payload);
    expect(link.startsWith("https://app.example/setup#")).toBe(true);
    expect(parseSetupHash(new URL(link).hash)).toEqual(payload);
  });

  it("틀린 값은 걸러 낸다", () => {
    const hash = `#${encodeURIComponent(JSON.stringify({ name: 1, phone: "010-1234&body=x", textSize: "huge", channels: ["", 3, "EBS"], familyCode: "x" }))}`;
    expect(parseSetupHash(hash)).toEqual({ name: "", phone: "0101234", textSize: "normal", channels: ["EBS"], familyCode: "" });
  });

  it("읽을 수 없으면 null", () => {
    expect(parseSetupHash("")).toBeNull();
    expect(parseSetupHash("#%E0%A4%A")).toBeNull();
    expect(parseSetupHash(`#${encodeURIComponent("[1,2]")}`)).toBeNull();
  });
});

describe("buildFamilyLinks", () => {
  it("iOS 와 안드로이드의 문자 주소 형식이 다르다", () => {
    expect(buildFamilyLinks("010-1234-5678", "https://scam.kr", true)?.sms).toMatch(/^sms:01012345678&body=/);
    expect(buildFamilyLinks("010-1234-5678", "https://scam.kr", false)?.sms).toMatch(/^sms:01012345678\?body=/);
  });

  it("번호에 섞인 매개변수는 지운다", () => {
    expect(buildFamilyLinks("010&body=hi", "u", false)?.sms.startsWith("sms:010?body=")).toBe(true);
  });

  it("번호가 없으면 null", () => {
    expect(buildFamilyLinks("", "u", false)).toBeNull();
  });
});

describe("seoulDayRange", () => {
  it("서울 자정 기준 하루", () => {
    expect(seoulDayRange(new Date("2026-10-04T16:30:00Z"))).toEqual({
      start: "2026-10-04T15:00:00.000Z",
      end: "2026-10-05T15:00:00.000Z",
    });
  });
});

describe("board", () => {
  it("빈 칸이 있으면 안내 문장", () => {
    expect(parseBoardDraft({ name: " ", title: "t", content: "c" })).toEqual({ ok: false, message: MESSAGES.boardDraftRequired });
  });

  it("길이를 자르고 앞뒤 공백을 지운다", () => {
    const result = parseBoardDraft({ name: " 김 ", title: "제".repeat(150), content: "내용" });
    expect(result.ok && result.value.title).toHaveLength(100);
    expect(result.ok && result.value.name).toBe("김");
  });

  it("author_id 는 이메일 앞부분만", () => {
    expect(boardAuthorId("kim.<b>@mail.com")).toBe("kim.b");
    expect(boardAuthorId(undefined)).toBe("회원");
  });
});
