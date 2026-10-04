import type { CheckVerdict } from "./types";

export function headlineFor(verdict: CheckVerdict): "괜찮아요" | "누르지 마세요" {
  return verdict === "danger" ? "누르지 마세요" : "괜찮아요";
}
