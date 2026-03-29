import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

function mapUser(u: SupabaseUser): User {
  return { id: u.id, email: u.email ?? '', createdAt: u.created_at };
}

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  initialize: () => () => void;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  loading: true,

  initialize: () => {
    // Hydrate from existing session
    supabase.auth.getSession()
      .then(({ data }) => {
        set({ currentUser: data.session?.user ? mapUser(data.session.user) : null, loading: false });
      })
      .catch(() => {
        // Network error or bad credentials — still stop the loading spinner
        set({ loading: false });
      });

    // Keep in sync; skip PASSWORD_RECOVERY — handled in App.tsx
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY') return;
      set({ currentUser: session?.user ? mapUser(session.user) : null, loading: false });
    });

    return () => subscription.unsubscribe();
  },

  register: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
    });
    if (error) return { success: false, error: error.message };
    // user exists but no session → email confirmation required
    if (data.user && !data.session) return { success: true, needsVerification: true };
    return { success: true };
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  loginWithApple: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  sendPasswordReset: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null });
  },
}));
