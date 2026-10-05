import { authHeaders } from "./auth-headers";
import { postJson } from "./api";

/** 보호자 케어용 시청·기사 열람. 실패해도 화면은 막지 않는다. */
export async function reportActivity(input: {
  kind: "video_watch" | "news_view";
  summary?: string;
  durationSec?: number;
}): Promise<void> {
  try {
    await postJson(
      "/api/activity",
      {
        kind: input.kind,
        summary: (input.summary ?? "").slice(0, 120),
        durationSec: Math.max(0, Math.floor(input.durationSec ?? 0)),
      },
      { headers: await authHeaders() },
    );
  } catch {
    // ignore
  }
}
