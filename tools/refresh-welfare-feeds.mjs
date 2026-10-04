#!/usr/bin/env node
/** 복지 캐시 갱신. 지역·종류마다 search-welfare 를 한 번씩만 호출한다. */

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;
const regions = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const categories = ["all", "care", "pension", "health", "housing"];

if (!url || !serviceKey || !cronSecret) {
  console.error("필요 환경 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET");
  process.exit(1);
}

let failed = 0;
for (const region of regions) {
  for (const category of categories) {
    const response = await fetch(`${url}/functions/v1/refresh-welfare-feeds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
        "x-cron-secret": cronSecret,
      },
      body: JSON.stringify({ region, category }),
    });
    const data = await response.json().catch(() => ({}));
    console.log(region, category, JSON.stringify(data));
    if (!response.ok || !data.ok) failed += 1;
  }
}

if (failed > 0) process.exit(1);
