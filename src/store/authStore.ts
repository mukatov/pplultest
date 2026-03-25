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

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}

const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@pplul.app',
  passwordHash: hashPassword('Demo2024!'),
  createdAt: '2025-12-01T00:00:00.000Z',
};

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
      users: [DEMO_USER],

      register: (email, password) => {
        try {
          const { users } = get();
          if (!email.includes('@')) return { success: false, error: 'Enter a valid email address' };
          if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, error: 'Email already registered' };
          }
          if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

          const user: User = {
            id: generateId(),
            email,
            passwordHash: hashPassword(password),
            createdAt: new Date().toISOString(),
          };
          set(state => ({ users: [...state.users, user], currentUser: user }));
          return { success: true };
        } catch (e) {
          return { success: false, error: 'Registration failed. Please try again.' };
        }
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
    {
      name: 'ppl-auth',
      merge: (persisted: any, current: AuthState) => {
        const users: User[] = persisted?.users ?? [];
        const hasDemo = users.some((u: User) => u.id === DEMO_USER.id);
        return {
          ...current,
          ...persisted,
          users: hasDemo ? users : [DEMO_USER, ...users],
        };
      },
    }
  )
);
