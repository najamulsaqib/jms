-- This file defines the database schema for the tax records management system.
-- It includes tables for tax records, portal pages, and user profiles, along with
-- necessary constraints and indexes to ensure data integrity and optimize query performance.

create table if not exists public.tax_records (
  id bigint generated always as identity primary key,
  reference_number text not null,
  name text not null,
  cnic text not null,
  email text,
  password text,
  phone text not null default '',
  reference text not null default '',
  status text not null check (status in ('active', 'inactive', 'late-filer')),
  notes text not null default '',
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tax_records_user_cnic_unique unique (user_id, cnic),
  constraint tax_records_user_reference_number_unique unique (user_id, reference_number)
);

create table if not exists public.portal_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  company_name text not null default '',
  address text not null default '',
  phone_number text not null default '',
  description text not null default '',
  avatar_url text not null default '',
  is_banned boolean not null default false,
  role text not null default 'user' check (role in ('admin', 'user')),
  managed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

update public.profiles p
set email = coalesce(u.email, '')
from auth.users u
where p.user_id = u.id
  and (p.email is null or p.email = '');

create index if not exists idx_portal_pages_user_id on public.portal_pages(user_id);
create index if not exists idx_portal_pages_sort_order on public.portal_pages(sort_order);
create index if not exists idx_profiles_managed_by on public.profiles(managed_by);
create index if not exists idx_profiles_role on public.profiles(role);

-- Auto-create a profile row whenever a new auth user is created.
-- Role priority:
-- 1) Explicit role in raw_app_meta_data (set via service role only)
-- 2) First-ever profile becomes admin (bootstrap)
-- 3) Everyone else defaults to user
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  final_role text;
  manager_id uuid;
begin
  requested_role := coalesce(new.raw_app_meta_data ->> 'role', '');

  if requested_role in ('admin', 'user') then
    final_role := requested_role;
  elsif not exists (select 1 from public.profiles where role = 'admin') then
    final_role := 'admin';
  else
    final_role := 'user';
  end if;

  if final_role = 'admin' then
    manager_id := null;
  else
    manager_id := nullif(new.raw_app_meta_data ->> 'managed_by', '')::uuid;
  end if;

  insert into public.profiles (
    user_id,
    email,
    full_name,
    company_name,
    role,
    managed_by,
    created_at,
    updated_at
  ) values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'company_name', ''),
    final_role,
    manager_id,
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- Allow users to read their own profile OR profiles they manage
CREATE POLICY "Users can view own and managed profiles"
ON public.profiles
FOR SELECT
USING (
  user_id = auth.uid()
  OR managed_by = auth.uid()
);
