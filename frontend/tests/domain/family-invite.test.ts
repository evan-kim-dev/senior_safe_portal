import { describe, expect, it } from "vitest";
import {
  generateInviteCode,
  INVITE_CODE_LENGTH,
  INVITE_TTL_MS,
  isFamilyRole,
  isInviteCode,
  normalizeInviteCode,
} from "@/lib/domain/family";
import { safeNextPath } from "@/lib/client/supabase-browser";

describe("invite code", () => {
  it("6자리 숫자만 허용한다", () => {
    expect(isInviteCode("123456")).toBe(true);
    expect(isInviteCode("000000")).toBe(true);
    expect(isInviteCode("12345")).toBe(false);
    expect(isInviteCode("1234567")).toBe(false);
    expect(isInviteCode("12a456")).toBe(false);
    expect(isInviteCode("")).toBe(false);
  });

  it("공백을 지운다", () => {
    expect(normalizeInviteCode(" 12 3456 ")).toBe("123456");
    expect(normalizeInviteCode(null)).toBe("");
  });

  it("안전한 6자리 코드를 만든다", () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(INVITE_CODE_LENGTH);
    expect(isInviteCode(code)).toBe(true);
  });

  it("초대 유효 시간은 24시간이다", () => {
    expect(INVITE_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });
});

describe("family role", () => {
  it("guardian 과 senior 만 허용한다", () => {
    expect(isFamilyRole("guardian")).toBe(true);
    expect(isFamilyRole("senior")).toBe(true);
    expect(isFamilyRole("admin")).toBe(false);
    expect(isFamilyRole("")).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("내부 경로만 허용한다", () => {
    expect(safeNextPath("/care")).toBe("/care");
    expect(safeNextPath("/link")).toBe("/link");
    expect(safeNextPath("//evil.com")).toBe("/board");
    expect(safeNextPath("https://evil.com")).toBe("/board");
    expect(safeNextPath(null, "/care")).toBe("/care");
  });
});
