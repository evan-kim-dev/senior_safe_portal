-- 챗봇(마카) 상담 중 위험 감지 활동 종류
alter table public.activity drop constraint if exists activity_kind_check;

alter table public.activity
  add constraint activity_kind_check
  check (kind in ('danger_video', 'danger_link', 'danger_chat', 'video_watch', 'news_view'));
