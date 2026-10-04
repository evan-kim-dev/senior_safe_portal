import { NextResponse } from "next/server";
import type { CheckFailure, CheckRequest, CheckResponse, CheckSuccess } from "@/lib/types";
import { recordDangerVideo } from "@/lib/activity";
import { postFunction } from "@/lib/invoke";
import { readFreshCheck, saveCheck } from "@/lib/link-cache";
import { classifyKind, titleFromUrl, toTwoLineReason } from "@/lib/url";
import { headlineFor } from "@/lib/verdict";

export const maxDuration = 60;

const FAIL_MESSAGE = "확인하지 못했어요. 잠시 후 다시 눌러 주세요.";

type AnalyzeLinkBody = {
  status?: string;
  reason?: string;
  message?: string;
  scraped?: {
    title?: string;
    url?: string;
  };
};

export async function POST(request: Request) {
  let payload: CheckRequest;
  try {
    payload = (await request.json()) as CheckRequest;
  } catch {
    return fail("주소를 넣어 주세요.", 400);
  }

  const url = typeof payload?.url === "string" ? payload.url.trim() : "";
  const familyCode = typeof payload?.familyCode === "string" ? payload.familyCode.trim() : "";
  if (!url) return fail("주소를 넣어 주세요.", 400);

  const cached = await readFreshCheck(url);
  if (cached) return NextResponse.json(cached satisfies CheckResponse);

  const result = await postFunction("analyze-link", { url }, 45_000);
  if (result.missingConfig) return fail(FAIL_MESSAGE, 503);
  if (result.transportError) return fail(FAIL_MESSAGE, 502);

  const data = result.data as AnalyzeLinkBody | null;
  if (!data || !result.ok || (data.status !== "안전" && data.status !== "위험")) {
    return fail(publicMessage(data?.message), result.ok ? 502 : result.status);
  }

  const checkedUrl = data.scraped?.url || url;
  const verdict = data.status === "위험" ? "danger" : "safe";
  const body: CheckSuccess = {
    ok: true,
    url: checkedUrl,
    kind: classifyKind(checkedUrl),
    verdict,
    headline: headlineFor(verdict),
    title: titleFromUrl(checkedUrl, data.scraped?.title),
    reason: toTwoLineReason(data.reason || ""),
  };

  await saveCheck(url, body);
  if (body.verdict === "danger" && body.kind === "video") {
    await recordDangerVideo(familyCode);
  }
  return NextResponse.json(body satisfies CheckResponse);
}

function publicMessage(raw: unknown): string {
  if (typeof raw !== "string") return FAIL_MESSAGE;
  const message = raw.replace(/\s+/g, " ").trim();
  if (!message || /api[_-]?key|gemini|supabase|stack|AIza|Bearer|token/i.test(message)) {
    return FAIL_MESSAGE;
  }
  return message.slice(0, 120);
}

function fail(message: string, status: number) {
  const body: CheckFailure = { ok: false, message };
  return NextResponse.json(body satisfies CheckResponse, { status });
}
