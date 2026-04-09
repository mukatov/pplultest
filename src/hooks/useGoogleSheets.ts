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
  }, 20_000);
}

export function useGoogleSheets() {
  const store       = useGoogleStore();
  const workoutSets = useWorkoutStore(s => s.workoutSets);
  const exercises   = useWorkoutStore(s => s.exercises);
  const currentUser = useAuthStore(s => s.currentUser);

  // Sheet is linked (sheetId persists across sessions)
  const isLinked = !!store.sheetId;
  // Token is present and not expired (in-memory only, lost on page reload)
  const isAuthorized = !!(
    store.accessToken &&
    !(store.tokenExpiry && Date.now() > store.tokenExpiry)
  );

  /**
   * Connect to Google Sheets or re-authorize an existing connection.
   *
   * - First time (no sheetId): full consent flow → create sheet → bulk sync → build pivots
   * - Already linked (has sheetId): silent re-auth via GIS → update token only
   *
   * Must be called from a click handler so GIS can open its consent UI.
   */
  const connect = async () => {
    if (store.sheetId) {
      // Re-authorize: user already gave consent, no need to show full consent screen
      const { accessToken, expiresIn } = await requestGISToken('');
      store.setTokens(accessToken, expiresIn);
      return;
    }

    // First-time connect: full consent + sheet creation
    const { accessToken, expiresIn } = await requestGISToken('consent');
    store.setTokens(accessToken, expiresIn);

    const sheetId = await createSpreadsheet(accessToken, 'PPL/UL Workouts');
    await initSheetHeaders(accessToken, sheetId);
    store.setSheet(sheetId, 'PPL/UL Workouts');

    // Bulk-sync all historical sets for this user
    if (currentUser) {
      const prefix      = `${currentUser.id}:`;
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
          rows.push([dateStr, timeStr, ws.dayType, name, i + 1, set.weight, set.reps, set.weight * set.reps]);
        });
      }

      if (rows.length > 0) {
        try { await appendRows(accessToken, sheetId, rows); } catch { /* best-effort */ }
      }
    }

    // Build pivot sheets after initial data load
    rebuildPivotSheets(accessToken, sheetId).catch(() => {});
  };

  /**
   * Append one set row to the connected spreadsheet.
   *
   * Uses the stored token directly — NEVER triggers a GIS refresh.
   * If the token is absent or expired, the row is silently dropped
   * (it's still saved locally). The user can re-authorize in Settings.
   */
  const appendSet = async (
    exerciseName: string, dayType: string, setIndex: number, weight: number, reps: number
  ) => {
    if (!store.sheetId || !store.accessToken) return;
    if (store.tokenExpiry && Date.now() > store.tokenExpiry) return; // expired — skip silently
    const now = new Date();
    try {
      await appendRows(store.accessToken, store.sheetId, [[
        now.toLocaleDateString('en-GB'),
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        dayType,
        exerciseName,
        setIndex,
        weight,
        reps,
        weight * reps,
      ]]);
      schedulePivotRebuild(store.accessToken, store.sheetId);
    } catch {
      // silently fail — never block a workout
    }
  };

  return {
    isLinked,
    isAuthorized,
    /** @deprecated use isLinked — kept for callers that just need "is a sheet configured" */
    isConnected: isLinked,
    sheetId:    store.sheetId,
    sheetTitle: store.sheetTitle,
    connect,
    disconnect: store.clearGoogle,
    appendSet,
  };
}
