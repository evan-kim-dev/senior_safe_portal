-- RLS·GRANT 재확인 (anon OK / service_role 은 서버만)
-- 공개 피드: SELECT 만
-- 게시판: 읽기 공개, 쓰기는 authenticated
-- 가족·활동·링크검사: anon/authenticated 직접 접근 없음 (API + service_role)

alter table if exists public.news_feeds enable row level security;
alter table if exists public.welfare_feeds enable row level security;
alter table if exists public.youtube_feeds enable row level security;
alter table if exists public.board_posts enable row level security;
alter table if exists public.family_groups enable row level security;
alter table if exists public.family_members enable row level security;
alter table if exists public.family_invites enable row level security;
alter table if exists public.activity enable row level security;
alter table if exists public.link_checks enable row level security;

revoke all on table public.family_groups from anon, authenticated, public;
revoke all on table public.family_members from anon, authenticated, public;
revoke all on table public.family_invites from anon, authenticated, public;
revoke all on table public.activity from anon, authenticated, public;
revoke all on table public.link_checks from anon, authenticated, public;

grant select on table public.news_feeds to anon, authenticated;
grant select on table public.welfare_feeds to anon, authenticated;
grant select on table public.youtube_feeds to anon, authenticated;

grant select on table public.board_posts to anon, authenticated;
grant insert, update, delete on table public.board_posts to authenticated;

-- 스토리지: 공개 버킷이 있어도 객체 정책은 소유자/서비스로 제한된 상태를 유지한다.
-- (대시보드에서 avatars 등 버킷 RLS 정책을 한 번 더 확인)
