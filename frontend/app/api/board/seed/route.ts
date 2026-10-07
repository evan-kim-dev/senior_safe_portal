import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { BOARD_DEMO_AUTHOR_ID, BOARD_MOCK_POSTS } from "@/lib/domain/board-mock";
import { cronAuthorized } from "@/lib/server/cron/feeds";
import { getServerEnv } from "@/lib/server/env";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

const DEMO_EMAIL = "board.demo@senior-safe.local";

function safeEqualText(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function seedAuthorized(request: Request, cronSecret: string | null, edgeSecret: string | null): boolean {
  if (cronSecret && cronAuthorized(request, cronSecret)) return true;
  if (!edgeSecret) return false;
  const internal = request.headers.get("x-internal-secret");
  if (typeof internal === "string" && safeEqualText(internal, edgeSecret)) return true;
  const bearer = request.headers.get("authorization");
  return Boolean(bearer?.startsWith("Bearer ") && safeEqualText(bearer.slice(7), edgeSecret));
}

/** 게시판 목업 글 시드. CRON_SECRET 또는 EDGE_INTERNAL_SECRET 필요. */
export const POST = withRoute(
  "board.seed",
  { rateLimit: { limit: 6, windowMs: 60_000 } },
  async (request, { log }) => {
    const env = getServerEnv();
    if (!env.supabaseUrl || !env.serviceRoleKey) {
      log.error("board_seed_misconfigured");
      return json({ ok: false, message: "지금은 실행할 수 없어요." }, { status: 503 });
    }
    if (!seedAuthorized(request, env.cronSecret, env.edgeInternalSecret)) {
      return json({ ok: false, message: "권한이 없어요." }, { status: 401 });
    }

    const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listed.error) {
      log.error("board_seed_user_list_failed", { message: listed.error.message });
      return json({ ok: false, message: "데모 계정을 확인하지 못했어요." }, { status: 500 });
    }

    let userId = listed.data.users.find((user) => user.email?.toLowerCase() === DEMO_EMAIL)?.id;
    if (!userId) {
      const created = await admin.auth.admin.createUser({
        email: DEMO_EMAIL,
        email_confirm: true,
        user_metadata: { full_name: "시니어 안심", account_role: "senior" },
        password: `BoardDemo-${crypto.randomUUID()}`,
      });
      userId = created.data.user?.id;
      if (created.error || !userId) {
        log.error("board_seed_user_failed", { message: created.error?.message });
        return json({ ok: false, message: "데모 계정을 만들지 못했어요." }, { status: 500 });
      }
    }

    const { error: deleteError } = await admin
      .from("board_posts")
      .delete()
      .eq("author_id", BOARD_DEMO_AUTHOR_ID);
    if (deleteError) {
      log.error("board_seed_delete_failed", { message: deleteError.message });
      return json({ ok: false, message: "이전 목업을 지우지 못했어요." }, { status: 500 });
    }

    const now = Date.now();
    const rows = BOARD_MOCK_POSTS.map((post) => ({
      user_id: userId,
      author_name: post.author_name,
      author_id: BOARD_DEMO_AUTHOR_ID,
      title: post.title,
      content: post.content,
      created_at: new Date(now - post.hoursAgo * 60 * 60 * 1000).toISOString(),
      view_count: 0,
    }));

    const { error: insertError } = await admin.from("board_posts").insert(rows);
    if (insertError) {
      log.error("board_seed_insert_failed", { message: insertError.message });
      return json({ ok: false, message: "목업 글을 올리지 못했어요." }, { status: 500 });
    }

    log.info("board_seed_done", { count: rows.length });
    return json({ ok: true, count: rows.length });
  },
);
