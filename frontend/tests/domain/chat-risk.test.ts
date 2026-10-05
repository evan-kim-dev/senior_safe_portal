import { describe, expect, it } from "vitest";
import { assessChatRisk, inferChatRiskFromReply } from "@/lib/domain/chat-risk";

describe("inferChatRiskFromReply", () => {
  it("강한 경고 문장이면 위험", () => {
    expect(inferChatRiskFromReply("문자 왔어요", "보이스피싱일 수 있어요. 누르지 마세요.", false)?.verdict).toBe(
      "danger",
    );
  });

  it("안전하다고만 말하면 위험으로 보지 않는다", () => {
    expect(inferChatRiskFromReply("링크", "공식 사이트라 안전해요.", false)?.verdict).toBe("safe");
  });
});

describe("assessChatRisk", () => {
  it("linkAnalysis 위험이면 danger", () => {
    const risk = assessChatRisk({
      message: "이 링크",
      reply: "설명",
      linkAnalysis: { status: "위험", reason: "피싱", scraped: { url: "https://bad.example" } },
    });
    expect(risk?.verdict).toBe("danger");
  });
});
