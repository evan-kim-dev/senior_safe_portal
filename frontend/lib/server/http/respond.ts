import { NextResponse } from "next/server";

/** API 응답은 사람마다 다르므로 브라우저·CDN 에 남기지 않는다. */
export function json(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): NextResponse {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: { "Cache-Control": "no-store", ...init.headers },
  });
}
