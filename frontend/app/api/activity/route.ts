import { getServices } from "@/lib/server/container";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

export const GET = withRoute("activity", { rateLimit: { limit: 60, windowMs: 60_000 } }, async (request) => {
  const familyCode = new URL(request.url).searchParams.get("familyCode") ?? "";
  const count = await getServices().activity.countDangerVideosToday(familyCode);
  return json({ count });
});
