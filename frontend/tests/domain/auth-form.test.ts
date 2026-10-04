import { describe, expect, it } from "vitest";
import {
  formatPhoneDisplay,
  normalizePhoneKr,
  passwordIssues,
  validateLoginForm,
  validateSignUpForm,
} from "@/lib/domain/auth-form";

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
  it("영문·숫자·길이 규칙을 검사한다", () => {
    expect(passwordIssues("short")).toEqual(expect.arrayContaining(["8자 이상", "숫자 포함"]));
    expect(passwordIssues("password1", "password@test.com")).toEqual(
      expect.arrayContaining(["이메일의 아이디와 다르게"]),
    );
    expect(passwordIssues("safePass9", "user@test.com")).toEqual([]);
  });
});

describe("validateSignUpForm", () => {
  const base = {
    name: "홍길동",
    email: "user@test.com",
    phone: "010-1234-5678",
    password: "safePass9",
    passwordConfirm: "safePass9",
    agreeTerms: true,
    agreePrivacy: true,
  };

  it("필수 동의와 형식을 검사한다", () => {
    expect(validateSignUpForm({ ...base, agreeTerms: false }).ok).toBe(false);
    expect(validateSignUpForm({ ...base, passwordConfirm: "other" }).ok).toBe(false);
    expect(validateSignUpForm(base)).toEqual({
      ok: true,
      value: {
        name: "홍길동",
        email: "user@test.com",
        phone: "+821012345678",
        password: "safePass9",
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
