-- JMS Tax fresh database setup (new project install)
-- This script is intentionally migration-free:
-- no ALTER TABLE, no DROP POLICY, no DROP TRIGGER.

-- ------------------------------------------------------------
-- 1) Core tables
-- ------------------------------------------------------------

create table public.tax_records (
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

create table public.portal_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
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

-- audit_logs.action values (AUDIT_ACTIONS enum in src/renderer/lib/enums.ts):
--   create | update | delete | bulk-create | bulk-update | bulk-delete | export-pdf | export-csv
-- audit_logs.snapshot->>'event' values (AUDIT_EVENTS enum in src/renderer/lib/enums.ts):
--   pdf_exported | csv_exported | bulk_status_updated_selected | bulk_status_updated_all
create table public.audit_logs (
  id bigserial primary key,
  module text not null,
  record_id text,
  action text not null,
  changed_by uuid references auth.users(id) on delete set null,
  managed_by uuid references auth.users(id) on delete set null,
  changed_by_name text,
  changes jsonb,
  snapshot jsonb,
  created_at timestamptz not null default now()
);

create table public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  can_create boolean not null default true,
  can_update boolean not null default true,
  can_delete boolean not null default false,
  can_bulk_operations boolean not null default false,
  can_export boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) Indexes
-- ------------------------------------------------------------

create index idx_tax_records_user_id on public.tax_records(user_id);
create index idx_tax_records_status on public.tax_records(status);
create index idx_tax_records_reference on public.tax_records(reference);
create index idx_tax_records_created_at on public.tax_records(created_at desc);

create index idx_portal_pages_user_id on public.portal_pages(user_id);
create index idx_portal_pages_sort_order on public.portal_pages(sort_order);

create index idx_profiles_managed_by on public.profiles(managed_by);
create index idx_profiles_role on public.profiles(role);

create index idx_audit_logs_lookup on public.audit_logs(module, record_id);
create index idx_audit_logs_changed_by on public.audit_logs(changed_by);
create index idx_audit_logs_managed_by on public.audit_logs(managed_by);

-- ------------------------------------------------------------
-- 3) Auth profile bootstrap
-- ------------------------------------------------------------

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
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'company_name', ''),
    final_role,
    manager_id,
    now(),
    now()
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- ------------------------------------------------------------
-- 4) RLS policies (fresh definitions)
-- ------------------------------------------------------------

create policy "Users can view own and managed profiles"
on public.profiles
for select
using (
  user_id = auth.uid()
  or managed_by = auth.uid()
);

create policy "Admin can update managed profiles"
on public.profiles
for update
using (managed_by = auth.uid())
with check (managed_by = auth.uid());

create policy "team_select"
on public.tax_records
for select
using (
  user_id = auth.uid()
  or user_id = (auth.jwt() -> 'app_metadata' ->> 'managed_by')::uuid
);

create policy "team_insert"
on public.tax_records
for insert
with check (
  user_id = auth.uid()
  or user_id = (auth.jwt() -> 'app_metadata' ->> 'managed_by')::uuid
);

create policy "team_update"
on public.tax_records
for update
using (
  user_id = auth.uid()
  or user_id = (auth.jwt() -> 'app_metadata' ->> 'managed_by')::uuid
);

create policy "team_delete"
on public.tax_records
for delete
using (
  user_id = auth.uid()
  or user_id = (auth.jwt() -> 'app_metadata' ->> 'managed_by')::uuid
);

create policy "audit_logs_insert"
on public.audit_logs
for insert
with check (
  auth.uid() is not null
  and (
    managed_by is null
    or managed_by = auth.uid()
    or managed_by = (auth.jwt() -> 'app_metadata' ->> 'managed_by')::uuid
  )
);

create policy "audit_logs_select"
on public.audit_logs
for select
using (
  changed_by = auth.uid()
  or managed_by = auth.uid()
  or changed_by in (
    select user_id from public.profiles where managed_by = auth.uid()
  )
  or managed_by in (
    select user_id from public.profiles where managed_by = auth.uid()
  )
  or changed_by in (
    select managed_by from public.profiles where user_id = auth.uid() and managed_by is not null
  )
  or managed_by in (
    select managed_by from public.profiles where user_id = auth.uid() and managed_by is not null
  )
);

create policy "permissions_select_own"
on public.user_permissions
for select
using (user_id = auth.uid());

create policy "permissions_select_managed"
on public.user_permissions
for select
using (
  user_id in (select user_id from public.profiles where managed_by = auth.uid())
);

create policy "permissions_insert_managed"
on public.user_permissions
for insert
with check (
  user_id in (select user_id from public.profiles where managed_by = auth.uid())
);

create policy "permissions_update_managed"
on public.user_permissions
for update
using (
  user_id in (select user_id from public.profiles where managed_by = auth.uid())
);
