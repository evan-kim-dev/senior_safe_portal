# 유튜브 추천 영상 — DB 캐시 + 자동 갱신

## 왜 바꾸나요?

YouTube Data API 무료 한도는 **하루 약 100회 검색**(10,000 units)입니다.  
**미리 수집 → DB 저장 → 모두 같은 목록 조회**하면 하루 **25회**(5회×5카테고리)만 씁니다.

---

## 최초 설정 (1회)

### 1. SQL

Supabase **SQL Editor** → `supabase/migrations/youtube_feeds.sql` 실행

### 2. Edge Functions 배포

| 함수 | 파일 |
|------|------|
| `search-videos` | `supabase/deploy/search-videos.ts` |
| `refresh-youtube-feeds` | `supabase/functions/refresh-youtube-feeds/index.ts` |

### 3. Supabase Edge Function Secrets

**Project Settings → Edge Functions → Secrets**

| Name | 설명 |
|------|------|
| `CRON_SECRET` | 임의의 긴 비밀 문자열 |
| `YOUTUBE_API_KEY` | search-videos용 |
| `GEMINI_API_KEY` | (검색창 실시간 검색 시) |

---

## Vercel Cron 자동화

GitHub Actions는 쓰지 않습니다. `frontend/vercel.json` + `/api/cron/refresh-feeds` 가 갱신을 호출합니다.

### 1. Vercel 환경 변수

프로젝트 **Settings → Environment Variables** (Production)

| Name | 값 |
|------|-----|
| `CRON_SECRET` | Supabase Edge Secrets와 **동일** |
| `SUPABASE_URL` | `https://….supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (서버 전용) |

### 2. 실행 시각 (KST)

| KST | UTC cron |
|-----|----------|
| **05:00** | `0 20 * * *` |
| **09:00** | `0 0 * * *` |
| **13:00** | `0 4 * * *` |
| **17:00** | `0 8 * * *` |
| **21:00** | `0 12 * * *` |

하루 **5카테고리 × 5회 = 25번** 검색 (YouTube) + 뉴스 **시간당 5번**(하루 120번) 호출.

### 3. 수동 확인

배포 후 Vercel → **Settings → Cron Jobs** 에서 등록 여부 확인.  
또는 (로컬/서버에서):

```powershell
Invoke-WebRequest -Uri "https://senior-safe-portal.vercel.app/api/cron/refresh-feeds" -Headers @{ Authorization = "Bearer (CRON_SECRET)" }
```

---

## 수동 실행 (PC)

```powershell
$env:SUPABASE_URL="https://oweduuhfkiutlszfwukt.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="(service_role)"
$env:CRON_SECRET="(CRON_SECRET)"
node tools/refresh-youtube-feeds.mjs
```

---

## 동작

| 기능 | 데이터 |
|------|--------|
| 홈·유튜브 탭 | `youtube_feeds` DB |
| DB 비어 있음 | 코드 fallback 영상 |
| 검색창 텍스트 | `search-videos` (실시간) |
| 링크 검사 | `analyze-link` (YouTube API 무관) |
