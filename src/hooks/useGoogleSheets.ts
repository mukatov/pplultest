import { useGoogleStore } from '../store/googleStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import {
  hasGoogleClientId,
  requestGISToken,
  createSpreadsheet,
  initSheetHeaders,
  appendRows,
  rebuildPivotSheets,
} from '../lib/googleSheets';

export { hasGoogleClientId };

// Debounce pivot rebuild so a full session (~10 sets) triggers one rebuild, not ten.
let _pivotTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePivotRebuild(token: string, sheetId: string) {
  if (_pivotTimer) clearTimeout(_pivotTimer);
  _pivotTimer = setTimeout(() => {
    rebuildPivotSheets(token, sheetId).catch(() => {});
    _pivotTimer = null;
  }, 20_000); // 20 s after the last set in a session
}

export function useGoogleSheets() {
  const store        = useGoogleStore();
  const workoutSets  = useWorkoutStore(s => s.workoutSets);
  const exercises    = useWorkoutStore(s => s.exercises);
  const currentUser  = useAuthStore(s => s.currentUser);

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
   * On first connect, bulk-syncs all previously logged sets then rebuilds pivot sheets.
   */
  const connect = async () => {
    const { accessToken, expiresIn } = await requestGISToken('consent');
    store.setTokens(accessToken, expiresIn);
    if (!store.sheetId) {
      const sheetId = await createSpreadsheet(accessToken, 'PPL/UL Workouts');
      await initSheetHeaders(accessToken, sheetId);
      store.setSheet(sheetId, 'PPL/UL Workouts');

      // Sync all historical sets for this user
      if (currentUser) {
        const prefix = `${currentUser.id}:`;
        const exerciseMap = new Map(exercises.map(e => [e.id, e.name]));

        const rows: (string | number)[][] = [];
        const sorted = [...workoutSets]
          .filter(ws => ws.exerciseId.startsWith(prefix))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (const ws of sorted) {
          const baseId  = ws.exerciseId.slice(prefix.length);
          const name    = exerciseMap.get(baseId) ?? exerciseMap.get(ws.exerciseId) ?? baseId;
          const d       = new Date(ws.date);
          const dateStr = d.toLocaleDateString('en-GB');
          const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

          ws.sets.forEach((set, i) => {
            rows.push([
              dateStr, timeStr, ws.dayType, name,
              i + 1, set.weight, set.reps, set.weight * set.reps,
            ]);
          });
        }

        if (rows.length > 0) {
          try {
            await appendRows(accessToken, sheetId, rows);
          } catch {
            // silently fail — sheet is connected, history sync is best-effort
          }
        }
      }

      // Build pivot sheets immediately after initial data load
      rebuildPivotSheets(accessToken, sheetId).catch(() => {});
    }
  };

  /**
   * Append one set row to the connected spreadsheet.
   * Silently ignores errors so a network hiccup never interrupts a workout.
   * Schedules a debounced pivot rebuild 20 s after the last set in a session.
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
      schedulePivotRebuild(token, store.sheetId);
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
