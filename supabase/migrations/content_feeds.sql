-- 뉴스·복지 일일 캐시, 링크 판정 6시간 캐시
-- Supabase SQL Editor에서 실행

create table if not exists public.news_feeds (
  category_id text primary key,
  label text not null,
  articles jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.news_feeds enable row level security;

drop policy if exists "news_feeds_select_all" on public.news_feeds;
create policy "news_feeds_select_all"
  on public.news_feeds for select
  using (true);

create table if not exists public.welfare_feeds (
  feed_key text primary key,
  region text not null,
  category text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.welfare_feeds enable row level security;

drop policy if exists "welfare_feeds_select_all" on public.welfare_feeds;
create policy "welfare_feeds_select_all"
  on public.welfare_feeds for select
  using (true);

create table if not exists public.link_checks (
  url_key text primary key,
  url text not null,
  kind text not null,
  verdict text not null,
  headline text not null,
  title text not null,
  reason text not null,
  checked_at timestamptz not null default now()
);

alter table public.link_checks enable row level security;
