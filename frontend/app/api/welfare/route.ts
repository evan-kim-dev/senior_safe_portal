import { MESSAGES } from "@/lib/domain/messages";
import { parseWelfareInput } from "@/lib/domain/validation";
import { getServices } from "@/lib/server/container";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

export const POST = withRoute("welfare", { rateLimit: { limit: 60, windowMs: 60_000 } }, async (request) => {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.reason === "too-large"
      ? json({ ok: false, message: MESSAGES.bodyTooLarge }, { status: 413 })
      : json({ ok: false, message: MESSAGES.welfareBadRequest }, { status: 400 });
  }

  const input = parseWelfareInput(body.value);
  if (!input.ok) return json({ ok: false, message: input.message }, { status: 400 });
  return json(await getServices().feeds.welfare(input.value));
});
