import { supabase } from '../lib/supabase';
import { toCamelCase } from '../lib/caseTransform';
import {
  CreatePortalPageInput,
  PortalPage,
  UpdatePortalPageInput,
} from '@shared/portalPage.contracts';

// ─── Supabase SQL ────────────────────────────────────────────────────────────
//
// Table creation:
//
// create table portal_pages (
//   id          uuid primary key default gen_random_uuid(),
//   user_id     uuid not null references auth.users(id) on delete cascade,
//   name        text not null,
//   url         text not null,
//   is_active   boolean not null default true,
//   sort_order  integer not null default 0,
//   created_at  timestamptz not null default now(),
//   updated_at  timestamptz not null default now()
// );

// alter table portal_pages enable row level security;

// create policy "Users manage own portal pages"
//   on portal_pages for all
//   using  (auth.uid() = user_id)
//   with check (auth.uid() = user_id);

// create index idx_portal_pages_user_id on portal_pages(user_id);
// create index idx_portal_pages_sort_order on portal_pages(sort_order);
//
// ─────────────────────────────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    await supabase.auth.signOut();
    throw new Error('Not authenticated');
  }
  return session.user.id;
}

function mapRow(row: Record<string, unknown>): PortalPage {
  const r = toCamelCase(row);
  return {
    id: r.id as string,
    name: r.name as string,
    url: r.url as string,
    isActive: r.isActive as boolean,
    sortOrder: r.sortOrder as number,
    createdAt: r.createdAt as string,
    updatedAt: r.updatedAt as string,
  };
}

async function list(): Promise<PortalPage[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('portal_pages')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

async function create(payload: CreatePortalPageInput): Promise<PortalPage> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('portal_pages')
    .insert({
      user_id: userId,
      name: payload.name,
      url: payload.url,
      is_active: payload.isActive ?? true,
      sort_order: payload.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

async function update(
  id: string,
  payload: UpdatePortalPageInput,
): Promise<PortalPage> {
  const userId = await getCurrentUserId();

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.name !== undefined) patch.name = payload.name;
  if (payload.url !== undefined) patch.url = payload.url;
  if (payload.isActive !== undefined) patch.is_active = payload.isActive;
  if (payload.sortOrder !== undefined) patch.sort_order = payload.sortOrder;

  const { data, error } = await supabase
    .from('portal_pages')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

async function remove(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('portal_pages')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export const portalPageApi = { list, create, update, remove };
