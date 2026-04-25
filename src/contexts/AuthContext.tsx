import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fetch role from the secure user_roles table (not user_metadata, which clients can edit)
async function fetchUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
  if (error) {
    console.error('Failed to fetch user role:', error);
    return null;
  }
  return (data as string | null) ?? null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const role = await fetchUserRole(nextSession.user.id);
      if (!isMounted) return;

      setUserRole(role);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncAuthState(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void syncAuthState(initialSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };


  const refreshAuth = async () => {
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    setSession(freshSession);
    setUser(freshSession?.user ?? null);

    if (!freshSession?.user) {
      setUserRole(null);
      return;
    }

    const role = await fetchUserRole(freshSession.user.id);
    setUserRole(role);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signIn, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
