-- 방어 심화: 민감 테이블은 RLS(정책 없음=거부)에 더해 GRANT 도 좁힌다.
-- 공개 피드는 SELECT 만, 게시판은 읽기+본인 쓰기, 가족/활동/링크검사는 서비스 롤 전용.

revoke all on table public.family_groups from anon, authenticated, public;
revoke all on table public.family_members from anon, authenticated, public;
revoke all on table public.family_invites from anon, authenticated, public;
revoke all on table public.activity from anon, authenticated, public;
revoke all on table public.link_checks from anon, authenticated, public;

revoke all on table public.news_feeds from anon, authenticated, public;
revoke all on table public.welfare_feeds from anon, authenticated, public;
revoke all on table public.youtube_feeds from anon, authenticated, public;
grant select on table public.news_feeds to anon, authenticated;
grant select on table public.welfare_feeds to anon, authenticated;
grant select on table public.youtube_feeds to anon, authenticated;

revoke all on table public.board_posts from anon, authenticated, public;
grant select on table public.board_posts to anon, authenticated;
grant insert, update, delete on table public.board_posts to authenticated;

drop policy if exists board_posts_update_view_count on public.board_posts;
create policy board_posts_update_view_count on public.board_posts
  for update
  to authenticated
  using (
    (view_count >= 0)
    and (char_length(title) >= 1)
    and (char_length(content) >= 1)
  )
  with check (
    (view_count >= 1)
    and (view_count <= 2147483647)
    and (char_length(title) >= 1)
    and (char_length(content) >= 1)
    and (user_id is not null)
  );

-- 아이디 찾기 RPC 는 서비스 롤만 (재확인)
revoke all on function public.find_login_email(text, text) from public;
revoke all on function public.find_login_email(text, text) from anon;
revoke all on function public.find_login_email(text, text) from authenticated;
grant execute on function public.find_login_email(text, text) to service_role;
