#!/usr/bin/env node
/** 뉴스 캐시 갱신. 환경 변수는 refresh-youtube-feeds 와 같다. */

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;
const categories = ["affairs", "society", "health", "welfare", "life"];

if (!url || !serviceKey || !cronSecret) {
  console.error("필요 환경 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET");
  process.exit(1);
}

let failed = 0;
for (const categoryId of categories) {
  const response = await fetch(`${url}/functions/v1/refresh-news-feeds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
      "x-cron-secret": cronSecret,
    },
    body: JSON.stringify({ categoryId }),
  });
  const data = await response.json().catch(() => ({}));
  console.log(categoryId, JSON.stringify(data));
  if (!response.ok || !data.ok) failed += 1;
}

if (failed > 0) process.exit(1);
