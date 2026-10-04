-- 아이디(이메일) 찾기: 이름·휴대폰으로 auth.users 메타데이터를 조회한다.
-- 서비스 롤(서버 API)만 호출한다.

create or replace function public.find_login_email(p_phone text, p_name text default '')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  found text;
  phone text := trim(coalesce(p_phone, ''));
  uname text := trim(coalesce(p_name, ''));
begin
  if phone = '' or uname = '' then
    return null;
  end if;

  select u.email
  into found
  from auth.users u
  where (
      coalesce(u.phone, '') = phone
      or coalesce(u.raw_user_meta_data->>'phone', '') = phone
    )
    and coalesce(u.raw_user_meta_data->>'full_name', '') = uname
  order by u.created_at desc
  limit 1;

  return found;
end;
$$;

revoke all on function public.find_login_email(text, text) from public;
revoke all on function public.find_login_email(text, text) from anon;
revoke all on function public.find_login_email(text, text) from authenticated;
grant execute on function public.find_login_email(text, text) to service_role;
