import type { CheckHeadline, CheckVerdict } from "./types";

export function headlineFor(verdict: CheckVerdict): CheckHeadline {
  return verdict === "danger" ? "누르지 마세요" : "괜찮아요";
}

/** analyze-link 의 "안전"/"위험" 만 판정으로 인정한다. 그 밖의 값은 판정 실패다. */
export function verdictFromStatus(status: unknown): CheckVerdict | null {
  if (status === "위험") return "danger";
  if (status === "안전") return "safe";
  return null;
}

export function isVerdict(value: unknown): value is CheckVerdict {
  return value === "safe" || value === "danger";
}
