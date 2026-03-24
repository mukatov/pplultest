import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

function hashPassword(password: string): string {
  // Simple deterministic hash for demo purposes
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
  register: (username: string, password: string) => { success: boolean; error?: string };
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],

      register: (username, password) => {
        const { users } = get();
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
          return { success: false, error: 'Username already taken' };
        }
        if (username.length < 3) return { success: false, error: 'Username must be at least 3 characters' };
        if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

        const user: User = {
          id: crypto.randomUUID(),
          username,
          passwordHash: hashPassword(password),
          createdAt: new Date().toISOString(),
        };
        set(state => ({ users: [...state.users, user], currentUser: user }));
        return { success: true };
      },

      login: (username, password) => {
        const { users } = get();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) return { success: false, error: 'User not found' };
        if (user.passwordHash !== hashPassword(password)) return { success: false, error: 'Wrong password' };
        set({ currentUser: user });
        return { success: true };
      },

      logout: () => set({ currentUser: null }),
    }),
    { name: 'ppl-auth' }
  )
);
