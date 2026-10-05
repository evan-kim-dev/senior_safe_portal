import { describe, expect, it } from "vitest";
import { formatWatchDuration } from "@/lib/domain/duration";

describe("formatWatchDuration", () => {
  it("초·분을 한국어로 표시한다", () => {
    expect(formatWatchDuration(0)).toBe("0분");
    expect(formatWatchDuration(45)).toBe("45초");
    expect(formatWatchDuration(60)).toBe("1분");
    expect(formatWatchDuration(125)).toBe("2분 5초");
  });
});
