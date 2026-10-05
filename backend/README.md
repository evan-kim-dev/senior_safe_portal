# backend

화면은 `frontend/`에 있고, 아래 Supabase 함수는 그대로 둡니다. Gemini 키는 이 함수의 `GEMINI_API_KEY`에만 있습니다.

| 역할 | 위치 |
|------|------|
| 링크 검사 | `supabase/functions/analyze-link` |
| 영상 수집 | `supabase/functions/search-videos` |
| 뉴스 수집 | `supabase/functions/search-news` |
| 복지 수집 | `supabase/functions/search-welfare` |
| 채팅 | `supabase/functions/chat-agent` |
| 게시판 | `board_posts` 테이블 |

프론트는 `/api/check`, `/api/videos`, `/api/news`, `/api/welfare`, `/api/chat`만 부릅니다.

영상·뉴스·복지는 페이지를 열 때 외부 API를 부르지 않습니다. 하루 5번(KST 05·09·13·17·21시) Vercel Cron이 `youtube_feeds`, `news_feeds`, `welfare_feeds`를 갱신하고, 화면은 그 테이블만 읽습니다.

`analyze-link`는 검사하기·붙여넣기·채팅의 주소 검사 버튼을 눌렀을 때만 호출됩니다. 같은 주소는 `link_checks`에 6시간 저장됩니다. 저장하려면 `frontend/.env.local`의 `SUPABASE_SERVICE_ROLE_KEY`가 필요하고, 이 키는 커밋하지 않습니다.

테이블 생성: `supabase/migrations/content_feeds.sql`
