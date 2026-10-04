import { MESSAGES } from "@/lib/domain/messages";
import { parseCheckInput } from "@/lib/domain/validation";
import { getServices } from "@/lib/server/container";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

export const maxDuration = 60;

export const POST = withRoute("check", { rateLimit: { limit: 20, windowMs: 60_000 } }, async (request) => {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.reason === "too-large"
      ? json({ ok: false, message: MESSAGES.bodyTooLarge }, { status: 413 })
      : json({ ok: false, message: MESSAGES.urlRequired }, { status: 400 });
  }

  const input = parseCheckInput(body.value);
  if (!input.ok) return json({ ok: false, message: input.message }, { status: 400 });

  const outcome = await getServices().check.check(input.value);
  return json(outcome.body, { status: outcome.status });
});
