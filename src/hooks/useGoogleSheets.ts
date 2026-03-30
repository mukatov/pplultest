import { useEffect } from 'react';
import { useGoogleStore } from '../store/googleStore';
import {
  hasGoogleClientId,
  startGoogleOAuth,
  exchangeCode,
  refreshAccessToken,
  createSpreadsheet,
  initSheetHeaders,
  appendRows,
} from '../lib/googleSheets';

export { hasGoogleClientId };

export function useGoogleSheets() {
  const store = useGoogleStore();

  const isConnected = !!(store.accessToken && store.sheetId);

  /** Returns a valid access token, refreshing if expired. Returns null on failure. */
  const getToken = async (): Promise<string | null> => {
    if (!store.accessToken) return null;
    const needsRefresh = store.tokenExpiry ? Date.now() > store.tokenExpiry - 60_000 : false;
    if (!needsRefresh) return store.accessToken;
    if (!store.refreshToken) { store.clearGoogle(); return null; }
    try {
      const { accessToken, expiresIn } = await refreshAccessToken(store.refreshToken);
      store.setTokens(accessToken, store.refreshToken, expiresIn);
      return accessToken;
    } catch {
      store.clearGoogle();
      return null;
    }
  };

  /** Complete the OAuth flow after a redirect callback, or start a new one. */
  const connect = async () => {
    const pendingCode     = sessionStorage.getItem('google_oauth_code');
    const pendingVerifier = sessionStorage.getItem('google_oauth_verifier');

    if (pendingCode && pendingVerifier) {
      sessionStorage.removeItem('google_oauth_code');
      sessionStorage.removeItem('google_oauth_verifier');
      sessionStorage.removeItem('google_oauth_return');

      const { accessToken, refreshToken, expiresIn } = await exchangeCode(pendingCode, pendingVerifier);
      store.setTokens(accessToken, refreshToken, expiresIn);

      if (!store.sheetId) {
        const sheetId = await createSpreadsheet(accessToken, 'PPL/UL Workouts');
        await initSheetHeaders(accessToken, sheetId);
        store.setSheet(sheetId, 'PPL/UL Workouts');
      }
      return;
    }

    // No pending code — start a new OAuth redirect
    await startGoogleOAuth();
  };

  /** On mount: auto-complete if returning from OAuth redirect. */
  useEffect(() => {
    const pendingCode     = sessionStorage.getItem('google_oauth_code');
    const pendingVerifier = sessionStorage.getItem('google_oauth_verifier');
    if (pendingCode && pendingVerifier) {
      connect().catch(console.error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Append one set row to the connected spreadsheet.
   * Silently ignores errors so a network hiccup never interrupts a workout.
   */
  const appendSet = async (
    exerciseName: string, dayType: string, setIndex: number, weight: number, reps: number
  ) => {
    if (!store.sheetId) return;
    const token = await getToken();
    if (!token) return;
    const now = new Date();
    try {
      await appendRows(token, store.sheetId, [[
        now.toLocaleDateString('en-GB'),
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        dayType,
        exerciseName,
        setIndex,
        weight,
        reps,
        weight * reps,
      ]]);
    } catch {
      // silently fail — never block a workout
    }
  };

  return {
    isConnected,
    sheetId:    store.sheetId,
    sheetTitle: store.sheetTitle,
    connect,
    disconnect: store.clearGoogle,
    appendSet,
  };
}
