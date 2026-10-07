/**
 * 게시판 목업 글을 프로덕션(/api/board/seed)에 올린다.
 *
 * 사용:
 *   node tools/seed-board-posts.mjs
 *   (frontend/.env.local 의 EDGE_INTERNAL_SECRET 또는 CRON_SECRET 필요)
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "frontend", ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = loadEnvFile(envPath);
const secret =
  process.env.EDGE_INTERNAL_SECRET ||
  process.env.CRON_SECRET ||
  fileEnv.EDGE_INTERNAL_SECRET ||
  fileEnv.CRON_SECRET ||
  "";
const base =
  process.env.SEED_BOARD_URL ||
  "https://senior-safe-portal.vercel.app/api/board/seed";

if (!secret) {
  console.error("EDGE_INTERNAL_SECRET 또는 CRON_SECRET 이 필요합니다.");
  process.exit(1);
}

const response = await fetch(base, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-internal-secret": secret,
    authorization: `Bearer ${secret}`,
  },
});

const text = await response.text();
let payload;
try {
  payload = JSON.parse(text);
} catch {
  console.error("seed failed: JSON이 아닙니다", response.status, text.slice(0, 200));
  process.exit(1);
}

if (!response.ok || payload?.ok !== true) {
  console.error("seed failed", response.status, payload);
  process.exit(1);
}

console.log("seed ok", payload);
