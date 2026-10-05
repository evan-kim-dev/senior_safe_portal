/**
 * 관리자(보호자) 가족에 데모 어르신 4명을 만들고 연결한다.
 *
 * 사용:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/seed-demo-seniors.mjs
 *   DEMO_GUARDIAN_EMAIL=admin@test.com  (선택, 기본: guardian 중 첫 계정)
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "../frontend/package.json"));
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const guardianEmail = (process.env.DEMO_GUARDIAN_EMAIL || "").trim().toLowerCase();

if (!url || !serviceKey) {
  console.error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  process.exit(1);
}

const DEMO_SENIORS = [
  {
    email: "demo.senior1@example.com",
    password: "DemoSenior1!",
    full_name: "김순자",
    birth_year: 1948,
    interests: ["music", "health"],
  },
  {
    email: "demo.senior2@example.com",
    password: "DemoSenior2!",
    full_name: "이영수",
    birth_year: 1955,
    interests: ["affairs", "history"],
  },
  {
    email: "demo.senior3@example.com",
    password: "DemoSenior3!",
    full_name: "박말숙",
    birth_year: 1942,
    interests: ["health", "entertainment"],
  },
  {
    email: "demo.senior4@example.com",
    password: "DemoSenior4!",
    full_name: "최만호",
    birth_year: 1960,
    interests: ["music", "entertainment"],
  },
];

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findGuardian() {
  const { data: members, error } = await admin
    .from("family_members")
    .select("family_id,user_id,role")
    .eq("role", "guardian")
    .order("joined_at", { ascending: true });
  if (error) throw error;
  if (!members?.length) throw new Error("guardian 멤버가 없습니다. 먼저 관리자 계정을 가입·가족 생성하세요.");

  if (guardianEmail) {
    for (const member of members) {
      const { data } = await admin.auth.admin.getUserById(member.user_id);
      const email = data.user?.email?.toLowerCase() ?? "";
      if (email === guardianEmail) return { familyId: member.family_id, userId: member.user_id, email };
    }
    throw new Error(`guardian 이메일 ${guardianEmail} 을 찾지 못했습니다.`);
  }

  // 어르신이 가장 적은 보호자 가족 우선
  let best = null;
  for (const member of members) {
    const { count } = await admin
      .from("family_members")
      .select("*", { count: "exact", head: true })
      .eq("family_id", member.family_id)
      .eq("role", "senior");
    const { data } = await admin.auth.admin.getUserById(member.user_id);
    const email = data.user?.email ?? member.user_id;
    const row = { familyId: member.family_id, userId: member.user_id, email, seniorCount: count ?? 0 };
    if (!best || row.seniorCount < best.seniorCount) best = row;
  }
  return best;
}

async function ensureSeniorUser(demo) {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.data.users.find((user) => user.email?.toLowerCase() === demo.email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: demo.password,
      email_confirm: true,
      user_metadata: {
        full_name: demo.full_name,
        account_role: "senior",
        birth_year: demo.birth_year,
        interests: demo.interests,
      },
    });
    return existing.id;
  }

  const created = await admin.auth.admin.createUser({
    email: demo.email,
    password: demo.password,
    email_confirm: true,
    user_metadata: {
      full_name: demo.full_name,
      account_role: "senior",
      birth_year: demo.birth_year,
      interests: demo.interests,
    },
  });
  if (created.error || !created.data.user) {
    throw created.error || new Error(`createUser 실패: ${demo.email}`);
  }
  return created.data.user.id;
}

async function linkSenior(familyId, userId) {
  const { data: membership } = await admin
    .from("family_members")
    .select("family_id,role")
    .eq("user_id", userId)
    .maybeSingle();

  if (membership?.family_id === familyId && membership.role === "senior") return "already";
  if (membership) {
    const { error: delError } = await admin.from("family_members").delete().eq("user_id", userId);
    if (delError) throw delError;
  }

  const { error } = await admin.from("family_members").insert({
    family_id: familyId,
    user_id: userId,
    role: "senior",
  });
  if (error) throw error;
  return "linked";
}

async function seedActivity(familyId, userId, name) {
  const now = Date.now();
  const rows = [
    {
      family_code: familyId,
      user_id: userId,
      kind: "danger_link",
      summary: `${name} 의심 문자`,
      duration_sec: 0,
      created_at: new Date(now - 60 * 60 * 1000).toISOString(),
    },
    {
      family_code: familyId,
      user_id: userId,
      kind: "video_watch",
      summary: "건강 체조",
      duration_sec: 420,
      created_at: new Date(now - 30 * 60 * 1000).toISOString(),
    },
    {
      family_code: familyId,
      user_id: userId,
      kind: "news_view",
      summary: "오늘 뉴스",
      duration_sec: 0,
      created_at: new Date(now - 10 * 60 * 1000).toISOString(),
    },
  ];
  // 첫 어르신만 위험, 나머지는 시청·기사만
  const payload = name.includes("김순자")
    ? rows
    : rows.filter((row) => row.kind !== "danger_link");
  const { error } = await admin.from("activity").insert(payload);
  if (error) console.warn("activity seed skip:", error.message);
}

async function main() {
  const guardian = await findGuardian();
  console.log(`대상 관리자: ${guardian.email}`);
  console.log(`가족 id: ${guardian.familyId}`);

  const results = [];
  for (const demo of DEMO_SENIORS) {
    const userId = await ensureSeniorUser(demo);
    const link = await linkSenior(guardian.familyId, userId);
    await seedActivity(guardian.familyId, userId, demo.full_name);
    results.push({ name: demo.full_name, email: demo.email, link });
  }

  console.log("데모 어르신 연결 완료:");
  for (const row of results) {
    console.log(`- ${row.name} <${row.email}> (${row.link})`);
  }
  console.log("비밀번호는 DemoSenior1!~DemoSenior4! 형식입니다.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
