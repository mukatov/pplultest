import { useGoogleStore } from '../store/googleStore';
import {
  hasGoogleClientId,
  requestGISToken,
  createSpreadsheet,
  initSheetHeaders,
  appendRows,
} from '../lib/googleSheets';

export { hasGoogleClientId };

export function useGoogleSheets() {
  const store = useGoogleStore();

  const isConnected = !!(store.accessToken && store.sheetId);

  /** Returns a valid access token, refreshing silently via GIS if expired. */
  const getToken = async (): Promise<string | null> => {
    if (!store.accessToken) return null;
    const needsRefresh = store.tokenExpiry ? Date.now() > store.tokenExpiry - 60_000 : false;
    if (!needsRefresh) return store.accessToken;
    try {
      const { accessToken, expiresIn } = await requestGISToken('');
      store.setTokens(accessToken, expiresIn);
      return accessToken;
    } catch {
      store.clearGoogle();
      return null;
    }
  };

  /**
   * Connect to Google Sheets via GIS token model.
   * Must be called from a click handler (GIS opens consent UI synchronously).
   */
  const connect = async () => {
    const { accessToken, expiresIn } = await requestGISToken('consent');
    store.setTokens(accessToken, expiresIn);
    if (!store.sheetId) {
      const sheetId = await createSpreadsheet(accessToken, 'PPL/UL Workouts');
      await initSheetHeaders(accessToken, sheetId);
      store.setSheet(sheetId, 'PPL/UL Workouts');
    }
  };

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
