-- 부모·자녀 계정 연동 (가족 그룹 · 초대 코드 · 활동 user_id)
-- Supabase SQL Editor에서 실행

create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.family_groups enable row level security;

create table if not exists public.family_members (
  family_id uuid not null references public.family_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('guardian', 'senior')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create unique index if not exists family_members_user_unique
  on public.family_members (user_id);

create index if not exists family_members_family_idx
  on public.family_members (family_id);

alter table public.family_members enable row level security;

create table if not exists public.family_invites (
  code text primary key,
  family_id uuid not null references public.family_groups (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists family_invites_family_idx
  on public.family_invites (family_id);

alter table public.family_invites enable row level security;

alter table public.activity
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists activity_user_day_idx
  on public.activity (user_id, created_at desc);
