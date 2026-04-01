import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GoogleState {
  accessToken: string | null;
  tokenExpiry: number | null; // ms timestamp
  sheetId:     string | null;
  sheetTitle:  string | null;
  setTokens:   (access: string, expiresIn: number) => void;
  setSheet:    (id: string, title: string) => void;
  clearGoogle: () => void;
}

export const useGoogleStore = create<GoogleState>()(
  persist(
    (set) => ({
      accessToken: null,
      tokenExpiry: null,
      sheetId:     null,
      sheetTitle:  null,
      setTokens: (access, expiresIn) => set({
        accessToken: access,
        tokenExpiry: Date.now() + expiresIn * 1000,
      }),
      setSheet:    (id, title) => set({ sheetId: id, sheetTitle: title }),
      clearGoogle: () => set({ accessToken: null, tokenExpiry: null, sheetId: null, sheetTitle: null }),
    }),
    { name: 'ppl-google' }
  )
);
