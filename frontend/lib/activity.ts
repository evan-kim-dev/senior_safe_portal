import "server-only";
import { seoulDayRange } from "./date";
import { serviceFetch } from "./feeds";

const FAMILY_CODE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isFamilyCode(value: string) {
  return FAMILY_CODE.test(value);
}

export async function recordDangerVideo(familyCode: string) {
  if (!isFamilyCode(familyCode)) return;

  await serviceFetch("activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ family_code: familyCode }),
  });
}

export async function countDangerVideosToday(familyCode: string): Promise<number> {
  if (!isFamilyCode(familyCode)) return 0;

  const { start, end } = seoulDayRange();
  const response = await serviceFetch(
    `activity?family_code=eq.${encodeURIComponent(familyCode)}&created_at=gte.${encodeURIComponent(start)}&created_at=lt.${encodeURIComponent(end)}&select=id`,
    {
      headers: {
        Prefer: "count=exact",
        Range: "0-0",
      },
    },
  );
  if (!response?.ok) return 0;
  const range = response.headers.get("content-range") ?? "";
  const total = Number(range.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}
