import { describe, expect, it } from "vitest";
import { decodeText } from "@/lib/domain/text";

describe("decodeText", () => {
  it("흔한 HTML 엔티티를 글자로 바꾼다", () => {
    expect(decodeText("A&hellip;B &quot;C&quot; &amp; D")).toBe("A…B \"C\" & D");
    expect(decodeText("&#8230;&#39;hi&#39;")).toBe("…'hi'");
  });
});
