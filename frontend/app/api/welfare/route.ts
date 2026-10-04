import { NextResponse } from "next/server";
import { EMPTY_FEED_MESSAGE, readFeedRows } from "@/lib/feeds";

type WelfareRow = {
  servNm?: string;
  target?: string;
  summary?: string;
  applicationMethod?: string;
  onlineAvailable?: string;
  site?: string;
  source?: string;
};

type StoredPayload = {
  region?: string;
  city?: string;
  services?: WelfareRow[];
  nationalServices?: WelfareRow[];
};

type FeedRow = { payload?: StoredPayload };

function applyText(row: WelfareRow): string {
  const method = row.applicationMethod?.replace(/\s+/g, " ").trim();
  if (method) return method;
  if (row.onlineAvailable === "Y") return "온라인으로 신청할 수 있습니다.";
  const site = row.site?.replace(/\s+/g, " ").trim();
  if (site) return site;
  return "안내가 없습니다.";
}

function targetText(row: WelfareRow): string {
  const target = row.target?.replace(/\s+/g, " ").trim();
  if (target) return target;
  const summary = row.summary?.replace(/\s+/g, " ").trim();
  if (summary) return summary;
  return "대상 안내가 없습니다.";
}

export async function POST(request: Request) {
  let region = "";
  let category = "all";
  try {
    const body = (await request.json()) as { region?: string; category?: string };
    region = typeof body.region === "string" ? body.region.trim() : "";
    category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "all";
  } catch {
    return NextResponse.json({ ok: false, message: "지역을 확인해 주세요." }, { status: 400 });
  }

  if (!region) {
    return NextResponse.json({ ok: false, message: "지역을 눌러 주세요." }, { status: 400 });
  }

  const feedKey = `${region}|${category}`;
  const rows = await readFeedRows<FeedRow>(
    `welfare_feeds?feed_key=eq.${encodeURIComponent(feedKey)}&select=payload`,
  );
  const payload = rows?.[0]?.payload;
  if (!payload) {
    return NextResponse.json({ ok: true, place: region, cards: [], message: EMPTY_FEED_MESSAGE });
  }

  const local = Array.isArray(payload.services) ? payload.services : [];
  const national = Array.isArray(payload.nationalServices) ? payload.nationalServices : [];
  const place = [payload.region, payload.city].filter((part) => typeof part === "string" && part).join(" ") || region;
  const cards = [...local, ...national]
    .filter((row) => typeof row.servNm === "string" && row.servNm.trim())
    .map((row) => ({
      title: row.servNm!.replace(/\s+/g, " ").trim(),
      target: targetText(row),
      apply: applyText(row),
      kind: row.source === "national" ? "전국" : "우리 동네",
    }));

  return NextResponse.json({ ok: true, place, cards });
}
