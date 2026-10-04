import { NextResponse } from "next/server";
import { callFunction, safeMessage } from "@/lib/invoke";

export const maxDuration = 60;

type HistoryItem = { role?: string; content?: string };

export async function POST(request: Request) {
  let message = "";
  let history: HistoryItem[] = [];
  try {
    const body = (await request.json()) as { message?: string; history?: HistoryItem[] };
    message = typeof body.message === "string" ? body.message.trim() : "";
    history = Array.isArray(body.history) ? body.history : [];
  } catch {
    return NextResponse.json({ ok: false, message: "질문을 보내지 못했습니다." }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ ok: false, message: "궁금한 점을 적어 주세요." }, { status: 400 });
  }

  const result = await callFunction("chat-agent", {
    message,
    history: history
      .filter((item) => (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
      .slice(-12)
      .map((item) => ({ role: item.role, content: item.content })),
  });

  const reply = typeof result.data.reply === "string" ? result.data.reply.trim() : "";
  if (!result.ok || !reply) {
    return NextResponse.json(
      { ok: false, message: safeMessage(result.data.message, "답을 받지 못했습니다. 잠시 후 다시 물어봐 주세요.") },
      { status: result.status || 502 },
    );
  }

  const analysis = result.data.linkAnalysis;
  let linkUrl = "";
  if (analysis && typeof analysis === "object" && !Array.isArray(analysis)) {
    const url = (analysis as { url?: string }).url;
    if (typeof url === "string") linkUrl = url;
  } else if (Array.isArray(analysis) && analysis[0] && typeof analysis[0].url === "string") {
    linkUrl = analysis[0].url;
  }

  if (!linkUrl) {
    const found = `${message}\n${reply}`.match(/https?:\/\/[^\s<>"']+/i);
    if (found) linkUrl = found[0].replace(/[),.;]+$/g, "");
  }

  return NextResponse.json({ ok: true, reply, linkUrl });
}
