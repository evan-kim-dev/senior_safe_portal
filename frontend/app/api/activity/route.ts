import { NextResponse } from "next/server";
import { countDangerVideosToday, isFamilyCode } from "@/lib/activity";

export async function GET(request: Request) {
  const familyCode = new URL(request.url).searchParams.get("familyCode") ?? "";
  if (!isFamilyCode(familyCode)) {
    return NextResponse.json({ count: 0 });
  }

  const count = await countDangerVideosToday(familyCode);
  return NextResponse.json({ count });
}
