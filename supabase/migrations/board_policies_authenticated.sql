-- 게시판 RLS: 쓰기·조회수 갱신은 authenticated, 읽기는 anon+authenticated

drop policy if exists board_posts_select_all on public.board_posts;
create policy board_posts_select_all
  on public.board_posts
  for select
  to anon, authenticated
  using (true);

drop policy if exists board_posts_insert_own on public.board_posts;
create policy board_posts_insert_own
  on public.board_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists board_posts_delete_own on public.board_posts;
create policy board_posts_delete_own
  on public.board_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

revoke update on table public.board_posts from anon, authenticated;
grant update (view_count) on table public.board_posts to authenticated;

drop policy if exists board_posts_update_view_count on public.board_posts;
create policy board_posts_update_view_count
  on public.board_posts
  for update
  to authenticated
  using (
    view_count >= 0
    and char_length(title) >= 1
    and char_length(content) >= 1
  )
  with check (
    view_count >= 1
    and view_count <= 2147483647
    and char_length(title) >= 1
    and char_length(content) >= 1
    and user_id is not null
  );
