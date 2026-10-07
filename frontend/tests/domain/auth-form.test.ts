import { describe, expect, it } from "vitest";
import {
  formatPhoneDisplay,
  maskEmail,
  normalizePhoneKr,
  passwordIssues,
  validateLoginForm,
  validateSignUpForm,
} from "@/lib/domain/auth-form";
import type { VideoInterestId } from "@/lib/domain/account-profile";

describe("normalizePhoneKr", () => {
  it("한국 휴대폰을 +82 로 만든다", () => {
    expect(normalizePhoneKr("010-1234-5678")).toBe("+821012345678");
    expect(normalizePhoneKr("01012345678")).toBe("+821012345678");
    expect(normalizePhoneKr("02-123-4567")).toBe("");
  });
});

describe("formatPhoneDisplay", () => {
  it("입력 중 하이픈을 붙인다", () => {
    expect(formatPhoneDisplay("01012345678")).toBe("010-1234-5678");
  });
});

describe("passwordIssues", () => {
  it("대소문자·숫자·특수문자·길이 규칙을 검사한다", () => {
    expect(passwordIssues("short")).toEqual(
      expect.arrayContaining(["8자 이상", "영문 대문자 포함", "숫자 포함", "특수문자 포함"]),
    );
    expect(passwordIssues("password1")).toEqual(
      expect.arrayContaining(["영문 대문자 포함", "특수문자 포함"]),
    );
    expect(passwordIssues("safePass9!")).toEqual([]);
  });
});

describe("validateSignUpForm", () => {
  const base = {
    name: "홍길동",
    nickname: "길동이",
    email: "user@test.com",
    phone: "010-1234-5678",
    password: "safePass9!",
    passwordConfirm: "safePass9!",
    accountRole: "guardian" as const,
    birthYear: "",
    interests: [] as VideoInterestId[],
    agreeTerms: true,
    agreePrivacy: true,
  };

  it("필수 동의와 형식을 검사한다", () => {
    expect(validateSignUpForm({ ...base, agreeTerms: false }).ok).toBe(false);
    expect(validateSignUpForm({ ...base, passwordConfirm: "other" }).ok).toBe(false);
    expect(validateSignUpForm({ ...base, nickname: "" }).ok).toBe(true);
    expect(validateSignUpForm({ ...base, accountRole: "" }).ok).toBe(false);
    expect(validateSignUpForm(base)).toEqual({
      ok: true,
      value: {
        name: "홍길동",
        nickname: "길동이",
        email: "user@test.com",
        phone: "+821012345678",
        password: "safePass9!",
        accountRole: "guardian",
        birthYear: null,
        interests: [],
      },
    });
  });

  it("어른 가입은 태어난 해가 필요하다", () => {
    const now = new Date("2026-10-06T00:00:00Z");
    expect(validateSignUpForm({ ...base, accountRole: "senior", birthYear: "" }, now).ok).toBe(false);
    expect(validateSignUpForm({ ...base, accountRole: "senior", birthYear: "2010" }, now).ok).toBe(false);
    expect(validateSignUpForm({
      ...base,
      accountRole: "senior",
      birthYear: "1955",
      interests: ["scam", "digital"],
    }, now)).toEqual({
      ok: true,
      value: {
        name: "홍길동",
        nickname: "길동이",
        email: "user@test.com",
        phone: "+821012345678",
        password: "safePass9!",
        accountRole: "senior",
        birthYear: 1955,
        interests: ["scam", "digital"],
      },
    });
  });
});

describe("validateLoginForm", () => {
  it("로그인 입력을 검사한다", () => {
    expect(validateLoginForm("", "password1")).toBe("이메일을 적어 주세요.");
    expect(validateLoginForm("user@test.com", "password1")).toBe("");
  });
});

describe("maskEmail", () => {
  it("이메일을 가린다", () => {
    expect(maskEmail("kh.kim@kangwon.ac.kr")).toBe("kh****@kangwon.ac.kr");
    expect(maskEmail("ab@test.com")).toBe("ab**@test.com");
    expect(maskEmail("a@test.com")).toBe("a**@test.com");
  });
});
