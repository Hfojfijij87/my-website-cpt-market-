-- CPT Market UK: Supabase Auth + referral/profile foundation.
-- Run this in Supabase SQL Editor after checking that an existing `profiles` table
-- does not contain a different schema. Do NOT use a service-role key in the browser.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  uid text not null unique,
  full_name text not null,
  email text not null unique,
  phone text,
  trading_balance numeric(18,2) not null default 0 check (trading_balance >= 0),
  funding_balance numeric(18,2) not null default 0 check (funding_balance >= 0),
  status text not null default 'active' check (status in ('active', 'suspended')),
  role text not null default 'user' check (role in ('user', 'admin', 'superadmin')),
  referred_by_user_id uuid references public.profiles(id) on delete set null,
  referred_by_uid text,
  used_referral_code text,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

create index if not exists profiles_referred_by_user_id_idx
  on public.profiles(referred_by_user_id);
create index if not exists profiles_uid_idx on public.profiles(uid);

create or replace function public.generate_profile_uid()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate text;
begin
  loop
    candidate := (floor(random() * 900000) + 100000)::bigint::text;
    exit when not exists (select 1 from public.profiles p where p.uid = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'superadmin' and p.status = 'active'
  );
$$;

create or replace function public.lookup_referral_code(p_code text)
returns table(uid text, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.uid, p.full_name
  from public.profiles p
  where p.uid = trim(coalesce(p_code, ''))
    and p.status = 'active'
  limit 1;
$$;

revoke all on function public.generate_profile_uid() from public, anon, authenticated;
revoke all on function public.is_super_admin() from public, anon;
revoke all on function public.lookup_referral_code(text) from public;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.lookup_referral_code(text) to anon, authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ref_code text;
  ref_profile public.profiles%rowtype;
  clean_email text;
begin
  clean_email := lower(coalesce(new.email, ''));
  ref_code := trim(coalesce(new.raw_user_meta_data ->> 'referral_code', ''));

  -- The reserved Super Admin email may be created without a referral. This does
  -- NOT grant the superadmin role; the explicit bootstrap UPDATE below does that.
  if clean_email <> 'ripuworkshop@gmail.com' then
    if ref_code = '' then
      raise exception 'A valid referral code is required.';
    end if;
    select * into ref_profile
      from public.profiles p
      where p.uid = ref_code and p.status = 'active'
      limit 1;
    if ref_profile.id is null then
      raise exception 'Invalid referral code.';
    end if;
    if ref_profile.id = new.id
      or ref_profile.email = clean_email
      or (nullif(trim(new.raw_user_meta_data ->> 'phone'), '') is not null
          and ref_profile.phone = trim(new.raw_user_meta_data ->> 'phone')) then
      raise exception 'Self-referral is not allowed.';
    end if;
  end if;

  insert into public.profiles (
    id, uid, full_name, email, phone,
    trading_balance, funding_balance, status, role,
    referred_by_user_id, referred_by_uid, used_referral_code, created_at
  ) values (
    new.id,
    public.generate_profile_uid(),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(clean_email, '@', 1)),
    clean_email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    0, 0, 'active', 'user',
    case when ref_profile.id is null then null else ref_profile.id end,
    case when ref_profile.id is null then null else ref_profile.uid end,
    case when ref_profile.id is null then null else ref_code end,
    coalesce(new.created_at, now())
  );
  return new;
end;
$$;

-- Replace only this project's auth.users insert trigger.
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

-- Backfill existing Supabase Auth accounts that were created before this trigger.
-- No referral is invented for historical accounts; new registrations still require a code.
insert into public.profiles (id, uid, full_name, email, phone, trading_balance, funding_balance, status, role, created_at)
select
  au.id,
  public.generate_profile_uid(),
  coalesce(nullif(trim(au.raw_user_meta_data ->> 'full_name'), ''), split_part(lower(au.email), '@', 1)),
  lower(au.email),
  nullif(trim(au.phone), ''),
  0, 0, 'active', 'user', coalesce(au.created_at, now())
from auth.users au
where au.email is not null
  and not exists (select 1 from public.profiles p where p.id = au.id)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;

-- A user may read only their own profile and accounts directly referred by them.
-- Super Admin may read all profiles. The security-definer role check avoids RLS recursion.
drop policy if exists "read own profile, own referrals, or super admin" on public.profiles;
create policy "read own profile, own referrals, or super admin"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or referred_by_user_id = auth.uid()
  or public.is_super_admin()
);

-- Admin-only balance/status action. Users cannot update their own balance or role.
create or replace function public.admin_update_profile(
  p_user_id uuid,
  p_trading_balance numeric default null,
  p_funding_balance numeric default null,
  p_status text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Super Admin permission required.' using errcode = '42501';
  end if;
  if p_status is not null and p_status not in ('active', 'suspended') then
    raise exception 'Invalid account status.';
  end if;
  update public.profiles
  set trading_balance = coalesce(p_trading_balance, trading_balance),
      funding_balance = coalesce(p_funding_balance, funding_balance),
      status = coalesce(p_status, status)
  where id = p_user_id;
  if not found then raise exception 'User not found.'; end if;
end;
$$;
revoke all on function public.admin_update_profile(uuid, numeric, numeric, text) from public, anon;
grant execute on function public.admin_update_profile(uuid, numeric, numeric, text) to authenticated;

create or replace function public.mark_my_last_login()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set last_login = now() where id = auth.uid();
end;
$$;
revoke all on function public.mark_my_last_login() from public, anon;
grant execute on function public.mark_my_last_login() to authenticated;

-- Bootstrap the existing Super Admin Auth account if it already exists.
-- If this returns 0 rows, first create ripuworkshop@gmail.com in Authentication > Users,
-- then run this statement again. Set/reset its password in Supabase Auth, not in source code.
insert into public.profiles (id, uid, full_name, email, phone, trading_balance, funding_balance, status, role, created_at)
select
  au.id,
  '100001',
  coalesce(nullif(trim(au.raw_user_meta_data ->> 'full_name'), ''), 'Ripu'),
  lower(au.email),
  nullif(trim(au.phone), ''),
  0, 0, 'active', 'superadmin', coalesce(au.created_at, now())
from auth.users au
where lower(au.email) = 'ripuworkshop@gmail.com'
on conflict (id) do update
set uid = '100001', role = 'superadmin', status = 'active',
    referred_by_user_id = null, referred_by_uid = null, used_referral_code = null;
