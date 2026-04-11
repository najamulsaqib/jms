import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@lib/supabase';
import { queryClient } from '@lib/queryClient';
import { TABLES } from '@lib/enums';
import { profileApi, type ProfileRow } from '@services/profile.api';

export type UserInfo = {
  email: string;
  createdAt: string;
  provider: string;
  fullName: string;
  companyName: string;
  address: string;
  phoneNumber: string;
  description: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  isAdmin: boolean;
  /** UUID of the admin who owns this user's account; null for admin accounts. */
  managedBy: string | null;
};

interface AuthContextValue {
  session: Session | null;
  userInfo: UserInfo | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (payload: {
    fullName: string;
    companyName: string;
    address: string;
    phoneNumber: string;
    description: string;
    avatarUrl: string;
  }) => Promise<void>;
  updatePassword: (payload: { newPassword: string }) => Promise<void>;
  sendPasswordResetOtp: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<void>;
  completePasswordReset: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  // When true, auth state changes are suppressed so the app doesn't
  // navigate away while the user is mid-password-reset.
  const passwordResetPending = useRef(false);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await profileApi.getCurrentProfile();
      setProfile(nextProfile);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let subscription: { unsubscribe(): void };

    (async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setSession(s);
      await loadProfile(s);
      setLoading(false);

      const { data } = supabase.auth.onAuthStateChange((_event, next) => {
        if (passwordResetPending.current) return;
        setSession(next);
        loadProfile(next).catch(() => setProfile(null));
      });
      subscription = data.subscription;
    })();

    return () => subscription?.unsubscribe();
  }, [loadProfile]);

  // Realtime: watch the current user's own profile row.
  //
  // Handles three admin actions in real-time:
  //   - Ban:    UPDATE sets is_banned=true  → immediate local sign-out
  //   - Delete: DELETE removes the row      → immediate local sign-out
  //   - Edit:   Any other UPDATE            → refresh local profile state
  //
  // Offline resilience: when the channel reconnects after an outage the
  // subscribe callback re-validates the profile. If it's gone (deleted) or
  // banned, the user is signed out as soon as connectivity is restored.
  //
  // IMPORTANT: requires the `profiles` table in the Supabase Realtime
  // publication: Dashboard → Database → Replication → enable `profiles`.
  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    let hasConnectedOnce = false;

    const forceSignOut = async () => {
      await supabase.auth.signOut({ scope: 'local' });
      queryClient.clear();
    };

    const channel = supabase
      .channel(`profile-watch:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLES.PROFILES,
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const updated = payload.new as Record<string, unknown>;

          if (updated.is_banned === true) {
            await forceSignOut();
            return;
          }

          // Any other profile change — keep local state in sync.
          try {
            const refreshed = await profileApi.getCurrentProfile();
            setProfile(refreshed);
          } catch {
            // Non-fatal — profile will re-sync on the next page load.
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: TABLES.PROFILES,
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await forceSignOut();
        },
      )
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;

        if (!hasConnectedOnce) {
          hasConnectedOnce = true;
          return; // First connect — profile was already loaded on boot.
        }

        // Reconnected after an outage. Re-validate: check if the profile
        // still exists and isn't banned (covers ban/delete while offline).
        const { data } = await supabase
          .from(TABLES.PROFILES)
          .select('is_banned')
          .eq('user_id', userId)
          .maybeSingle();

        // null  = profile deleted; true = banned while offline
        if (!data || data.is_banned === true) {
          await forceSignOut();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  }, []);

  const updateProfile = useCallback(
    async (payload: {
      fullName: string;
      companyName: string;
      address: string;
      phoneNumber: string;
      description: string;
      avatarUrl: string;
    }) => {
      const nextProfile = await profileApi.upsertCurrentProfile({
        fullName: payload.fullName.trim(),
        companyName: payload.companyName.trim(),
        address: payload.address.trim(),
        phoneNumber: payload.phoneNumber.trim(),
        description: payload.description.trim(),
        avatarUrl: payload.avatarUrl,
      });
      setProfile(nextProfile);
    },
    [],
  );

  const updatePassword = useCallback(
    async (payload: { newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: payload.newPassword,
      });

      if (error) throw error;
    },
    [],
  );

  const sendPasswordResetOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) throw error;
  }, []);

  const verifyPasswordResetOtp = useCallback(
    async (email: string, token: string) => {
      // Suppress the SIGNED_IN event that verifyOtp fires so the app
      // doesn't route the user in before they've set a new password.
      passwordResetPending.current = true;
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) {
        passwordResetPending.current = false;
        throw error;
      }
      // Flag stays true — Supabase JS client holds the session internally
      // so updateUser will work, but our React session state stays null.
    },
    [],
  );

  const completePasswordReset = useCallback(async (newPassword: string) => {
    // Supabase JS client still has the OTP session; updateUser works fine.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    // Clear the pending flag before signing out so the SIGNED_OUT event
    // propagates normally (sets session → null).
    passwordResetPending.current = false;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      session,
      userInfo: session?.user
        ? (() => {
            const role = profile?.role ?? 'user';
            return {
              email: session.user.email ?? '',
              createdAt: session.user.created_at,
              provider:
                (session.user.app_metadata?.provider as string) ?? 'unknown',
              fullName: profile?.fullName ?? '',
              companyName: profile?.companyName ?? '',
              address: profile?.address ?? '',
              phoneNumber: profile?.phoneNumber ?? '',
              description: profile?.description ?? '',
              avatarUrl: profile?.avatarUrl ?? '',
              role: role as 'admin' | 'user',
              isAdmin: role === 'admin',
              managedBy: profile?.managedBy ?? null,
            } satisfies UserInfo;
          })()
        : null,
      loading,
      signIn,
      signOut,
      updateProfile,
      updatePassword,
      sendPasswordResetOtp,
      verifyPasswordResetOtp,
      completePasswordReset,
    }),
    [
      session,
      profile,
      loading,
      signIn,
      signOut,
      updateProfile,
      updatePassword,
      sendPasswordResetOtp,
      verifyPasswordResetOtp,
      completePasswordReset,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
