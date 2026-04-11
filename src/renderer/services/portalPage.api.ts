import { TABLES } from '@lib/enums';
import {
  CreatePortalPageInput,
  PortalPage,
  UpdatePortalPageInput,
} from '@shared/portalPage.contracts';
import { toCamelCase } from '../lib/caseTransform';
import { supabase } from '../lib/supabase';

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
    .from(TABLES.PORTAL_PAGES)
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
    .from(TABLES.PORTAL_PAGES)
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
    .from(TABLES.PORTAL_PAGES)
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
    .from(TABLES.PORTAL_PAGES)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export const portalPageApi = { list, create, update, remove };
