-- 오늘 위험한 영상 개수용. 주소, 제목, 영상 내용은 넣지 않는다.
-- Supabase SQL Editor에서 실행

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  created_at timestamptz not null default now()
);

create index if not exists activity_family_day_idx
  on public.activity (family_code, created_at desc);

alter table public.activity enable row level security;
