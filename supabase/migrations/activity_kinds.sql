-- 보호자 케어용 활동 종류·요약·시청 초
-- Supabase SQL Editor에서 실행

alter table public.activity
  add column if not exists kind text not null default 'danger_video';

alter table public.activity
  add column if not exists summary text not null default '';

alter table public.activity
  add column if not exists duration_sec integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'activity_kind_check'
  ) then
    alter table public.activity
      add constraint activity_kind_check
      check (kind in ('danger_video', 'danger_link', 'danger_chat', 'video_watch', 'news_view'));
  end if;
end $$;

create index if not exists activity_family_kind_day_idx
  on public.activity (family_code, kind, created_at desc);
