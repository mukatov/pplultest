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
    {
      name: 'ppl-google',
      // Don't persist the token — it expires after 1 hr and persisting it causes
      // GIS to silently re-auth mid-workout when the stale token is detected.
      // sheetId/sheetTitle persist so users don't need to re-link their sheet.
      partialize: (state) => ({ sheetId: state.sheetId, sheetTitle: state.sheetTitle }),
    }
  )
);
