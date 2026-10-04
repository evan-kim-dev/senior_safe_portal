import { MESSAGES } from "@/lib/domain/messages";
import { parseChatInput } from "@/lib/domain/validation";
import { getServices } from "@/lib/server/container";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

export const maxDuration = 60;

export const POST = withRoute("chat", { rateLimit: { limit: 30, windowMs: 60_000 } }, async (request) => {
  const body = await readJsonBody(request, 1_200_000);
  if (!body.ok) {
    return body.reason === "too-large"
      ? json({ ok: false, message: MESSAGES.bodyTooLarge }, { status: 413 })
      : json({ ok: false, message: MESSAGES.chatSendFailed }, { status: 400 });
  }

  const input = parseChatInput(body.value);
  if (!input.ok) return json({ ok: false, message: input.message }, { status: 400 });

  const outcome = await getServices().chat.ask(input.value);
  return json(outcome.body, { status: outcome.status });
});
