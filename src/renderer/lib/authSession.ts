import { supabase } from '@lib/supabase';

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  return session;
}

export async function getAccessToken(): Promise<string> {
  const session = await getCurrentSession();
  const token = session.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  return token;
}

export async function getCurrentUserId(): Promise<string> {
  const session = await getCurrentSession();
  return session.user.id;
}

export async function refreshAuthSession(): Promise<void> {
  const { error } = await supabase.auth.refreshSession();

  if (error) {
    console.warn('Failed to refresh auth session', error);
  }
}
