import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

interface AuthState {
  currentUser: User | null;
  users: User[];
  register: (email: string, password: string) => { success: boolean; error?: string };
  login: (email: string, password: string) => { success: boolean; error?: string };
  resetPassword: (email: string, newPassword: string) => { success: boolean; error?: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],

      register: (email, password) => {
        const { users } = get();
        if (!email.includes('@')) return { success: false, error: 'Enter a valid email address' };
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
          return { success: false, error: 'Email already registered' };
        }
        if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

        const user: User = {
          id: crypto.randomUUID(),
          email,
          passwordHash: hashPassword(password),
          createdAt: new Date().toISOString(),
        };
        set(state => ({ users: [...state.users, user], currentUser: user }));
        return { success: true };
      },

      login: (email, password) => {
        const { users } = get();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return { success: false, error: 'No account found with this email' };
        if (user.passwordHash !== hashPassword(password)) return { success: false, error: 'Wrong password' };
        set({ currentUser: user });
        return { success: true };
      },

      resetPassword: (email, newPassword) => {
        const { users } = get();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return { success: false, error: 'No account found with this email' };
        if (newPassword.length < 6) return { success: false, error: 'Password must be at least 6 characters' };
        const updated = { ...user, passwordHash: hashPassword(newPassword) };
        set(state => ({ users: state.users.map(u => u.id === updated.id ? updated : u) }));
        return { success: true };
      },

      logout: () => set({ currentUser: null }),
    }),
    { name: 'ppl-auth' }
  )
);
