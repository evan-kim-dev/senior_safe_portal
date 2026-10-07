import { parseFeedInput } from "@/lib/domain/validation";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

export const POST = withRoute("news", { rateLimit: { limit: 60, windowMs: 60_000 } }, async (request) => {
  const body = await readJsonBody(request);
  const input = parseFeedInput(body.ok ? body.value : null);
  if (!input.ok) return json({ ok: false, message: input.message }, { status: 400 });
  const user = await requireUser(request);
  return json(
    await getServices().feeds.news(input.value.categoryId, {
      metadata: user?.metadata,
    }),
  );
});
