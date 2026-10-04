import { describe, expect, it } from "vitest";
import {
  generateInviteCode,
  INVITE_CODE_LENGTH,
  INVITE_TTL_MS,
  isFamilyRole,
  isInviteCode,
  normalizeInviteCode,
} from "@/lib/domain/family";
import { safeNextPath, validateEmailPassword } from "@/lib/client/supabase-browser";

describe("invite code", () => {
  it("8자리 영문·숫자만 허용한다", () => {
    expect(isInviteCode("AB23CD45")).toBe(true);
    expect(isInviteCode("ab23cd45")).toBe(true);
    expect(isInviteCode("123456")).toBe(false);
    expect(isInviteCode("1234567")).toBe(false);
    expect(isInviteCode("ABCD")).toBe(false);
    expect(isInviteCode("")).toBe(false);
  });

  it("공백을 지우고 대문자로 만든다", () => {
    expect(normalizeInviteCode(" ab 23cd45 ")).toBe("AB23CD45");
    expect(normalizeInviteCode(null)).toBe("");
  });

  it("안전한 초대 코드를 만든다", () => {
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
    expect(safeNextPath("/\\evil.com")).toBe("/board");
    expect(safeNextPath("/foo@bar")).toBe("/board");
    expect(safeNextPath(null, "/care")).toBe("/care");
  });
});

describe("validateEmailPassword", () => {
  it("이메일·비밀번호 기본 규칙을 검사한다", () => {
    expect(validateEmailPassword("", "password1")).toBe("이메일을 적어 주세요.");
    expect(validateEmailPassword("a@", "password1")).toBe("이메일 형식을 확인해 주세요.");
    expect(validateEmailPassword("a@b.com", "")).toBe("비밀번호를 적어 주세요.");
    expect(validateEmailPassword("a@b.com", "short")).toBe("비밀번호는 8자 이상으로 적어 주세요.");
    expect(validateEmailPassword("a@b.com", "password1")).toBe("");
  });
});
