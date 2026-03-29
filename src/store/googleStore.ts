import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GoogleState {
  accessToken:  string | null;
  refreshToken: string | null;
  tokenExpiry:  number | null; // ms timestamp
  sheetId:      string | null;
  sheetTitle:   string | null;
  setTokens:    (access: string, refresh: string | null, expiresIn: number) => void;
  setSheet:     (id: string, title: string) => void;
  clearGoogle:  () => void;
}

export const useGoogleStore = create<GoogleState>()(
  persist(
    (set) => ({
      accessToken:  null,
      refreshToken: null,
      tokenExpiry:  null,
      sheetId:      null,
      sheetTitle:   null,
      setTokens: (access, refresh, expiresIn) => set({
        accessToken:  access,
        refreshToken: refresh ?? null,
        tokenExpiry:  Date.now() + expiresIn * 1000,
      }),
      setSheet:    (id, title) => set({ sheetId: id, sheetTitle: title }),
      clearGoogle: () => set({ accessToken: null, refreshToken: null, tokenExpiry: null, sheetId: null, sheetTitle: null }),
    }),
    { name: 'ppl-google' }
  )
);
