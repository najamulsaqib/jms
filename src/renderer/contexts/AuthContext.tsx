import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (payload: {
    fullName: string;
    companyName: string;
    address: string;
    phoneNumber: string;
    description: string;
  }) => Promise<void>;
  updatePassword: (payload: { newPassword: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe(): void };

    (async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setSession(s);
      setLoading(false);

      const { data } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
      });
      subscription = data.subscription;
    })();

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (payload: {
      fullName: string;
      companyName: string;
      address: string;
      phoneNumber: string;
      description: string;
    }) => {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: payload.fullName.trim(),
          company_name: payload.companyName.trim(),
          address: payload.address.trim(),
          phone_number: payload.phoneNumber.trim(),
          description: payload.description.trim(),
        },
      });

      if (error) throw error;

      const {
        data: { session: refreshedSession },
      } = await supabase.auth.getSession();
      setSession(refreshedSession);
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

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signOut,
      updateProfile,
      updatePassword,
    }),
    [session, loading, signIn, signOut, updateProfile, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
