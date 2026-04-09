// ─── Google Sheets integration ────────────────────────────────────────────────
// Uses Google Identity Services (GIS) token model — no client_secret, no backend.

const CLIENT_ID  = '432754734536-bvvmjh2vobv0hg45rk0drbt06t3oa0fv.apps.googleusercontent.com';
const SCOPES     = 'https://www.googleapis.com/auth/spreadsheets';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

export const hasGoogleClientId = true;

export interface OAuthResult {
  accessToken: string;
  expiresIn:   number;
}

/**
 * Request a Google access token via GIS.
 * MUST be called synchronously from a click handler to avoid popup blocking.
 * Use prompt='consent' for first-time auth, prompt='' for silent refresh.
 */
export function requestGISToken(prompt = 'consent'): Promise<OAuthResult> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded — try refreshing the page'));
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope:     SCOPES,
      callback:  (resp) => {
        if (resp.error) { reject(new Error(resp.error)); return; }
        resolve({ accessToken: resp.access_token, expiresIn: resp.expires_in });
      },
      error_callback: (err) => reject(new Error(err.message ?? err.type)),
    });
    client.requestAccessToken({ prompt });
  });
}

// ─── Spreadsheet helpers ──────────────────────────────────────────────────────

export async function createSpreadsheet(accessToken: string, title: string): Promise<string> {
  const res  = await fetch(SHEETS_API, {
    method:  'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ properties: { title } }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.spreadsheetId as string;
}

export async function initSheetHeaders(accessToken: string, sheetId: string) {
  await appendRows(accessToken, sheetId, [
    ['Date', 'Time', 'Day', 'Exercise', 'Set #', 'Weight (kg)', 'Reps', 'Volume (kg)'],
  ]);
}

export async function appendRows(
  accessToken: string, sheetId: string, rows: (string | number)[][]
) {
  const url = `${SHEETS_API}/${sheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res  = await fetch(url, {
    method:  'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ values: rows }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
}

// ─── Pivot sheet rebuild ──────────────────────────────────────────────────────
// Rebuilds one tab per day type directly via Sheets API.
// Called automatically after connect (full sync) and debounced after each set append.

const RAW_SHEET = 'PPL/UL Workouts';

interface PivotRow {
  date:     string;
  exercise: string;
  setNum:   number;
  weight:   string;
  reps:     string;
}

/** Parse DD/MM/YYYY → sortable YYYY-MM-DD */
function isoDate(raw: string): string {
  const p = raw.split('/');
  if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  return raw.split('T')[0];
}

async function sheetsGet(token: string, url: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

async function batchUpdateChunked(token: string, spreadsheetId: string, requests: object[]) {
  const CHUNK = 50;
  for (let i = 0; i < requests.length; i += CHUNK) {
    await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ requests: requests.slice(i, i + CHUNK) }),
    });
  }
}

async function buildOnePivotSheet(
  token: string,
  spreadsheetId: string,
  dayType: string,
  rows: PivotRow[],
  existingSheets: { title: string; id: number }[],
) {
  // ── Pivot dimensions ──
  const dateSet = new Set<string>();
  const exSet   = new Set<string>();
  for (const r of rows) { dateSet.add(r.date); exSet.add(r.exercise); }

  const dates     = [...dateSet].sort((a, b) => isoDate(a).localeCompare(isoDate(b)));
  const exercises = [...exSet];

  let globalMaxSets = 1;
  for (const r of rows) if (r.setNum > globalMaxSets) globalMaxSets = r.setNum;

  const lookup: Record<string, Record<string, Record<number, { w: string; reps: string }>>> = {};
  for (const r of rows) {
    ((lookup[r.exercise] ??= {})[r.date] ??= {})[r.setNum] = { w: r.weight, reps: r.reps };
  }

  const colsPerDate = globalMaxSets * 2;
  const totalCols   = 1 + dates.length * colsPerDate;
  const totalRows   = 3 + exercises.length;

  // ── Grid values ──
  const empty = (n: number) => Array<string>(n).fill('');

  const hdr1 = ['Exercise', ...dates.flatMap(d => [d, ...empty(colsPerDate - 1)])];
  const hdr2 = ['', ...dates.flatMap(() =>
    Array.from({ length: globalMaxSets }, (_, i) => [`Set ${i + 1}`, '']).flat()
  )];
  const hdr3 = ['', ...dates.flatMap(() =>
    Array.from({ length: globalMaxSets }, () => ['kg', 'rep']).flat()
  )];
  const dataRows = exercises.map(ex => [
    ex,
    ...dates.flatMap(d =>
      Array.from({ length: globalMaxSets }, (_, i) => {
        const c = lookup[ex]?.[d]?.[i + 1];
        return [c?.w ?? '', c?.reps ?? ''];
      }).flat()
    ),
  ]);

  // ── Delete existing sheet + add fresh one ──
  const existing = existingSheets.find(s => s.title === dayType);
  const createRequests: object[] = [];
  if (existing) createRequests.push({ deleteSheet: { sheetId: existing.id } });
  createRequests.push({
    addSheet: {
      properties: {
        title: dayType,
        index: 1,
        gridProperties: {
          rowCount:    Math.max(totalRows, 20),
          columnCount: Math.max(totalCols, 10),
        },
      },
    },
  });

  const batchRes = await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ requests: createRequests }),
  });
  const batchData = await batchRes.json();
  const newSheetId: number =
    batchData.replies?.find((r: { addSheet?: { properties?: { sheetId?: number } } }) => r.addSheet)
      ?.addSheet?.properties?.sheetId ?? 0;

  // ── Write values ──
  const range = `${dayType}!A1`;
  await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method:  'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ values: [hdr1, hdr2, hdr3, ...dataRows] }),
    },
  );

  // ── Format ──
  const fmt: object[] = [];

  // Merge date header cells (row 1)
  for (let di = 0; di < dates.length; di++) {
    const c = 1 + di * colsPerDate;
    if (colsPerDate > 1) fmt.push({
      mergeCells: {
        range: { sheetId: newSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: c, endColumnIndex: c + colsPerDate },
        mergeType: 'MERGE_ALL',
      },
    });
  }

  // Merge set label cells (row 2)
  for (let di = 0; di < dates.length; di++) {
    for (let s = 0; s < globalMaxSets; s++) {
      const c = 1 + di * colsPerDate + s * 2;
      fmt.push({
        mergeCells: {
          range: { sheetId: newSheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: c, endColumnIndex: c + 2 },
          mergeType: 'MERGE_ALL',
        },
      });
    }
  }

  // Freeze 3 header rows + exercise column
  fmt.push({
    updateSheetProperties: {
      properties: { sheetId: newSheetId, gridProperties: { frozenRowCount: 3, frozenColumnCount: 1 } },
      fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
    },
  });

  // Column widths
  fmt.push({
    updateDimensionProperties: {
      range: { sheetId: newSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
      properties: { pixelSize: 185 },
      fields: 'pixelSize',
    },
  });
  if (totalCols > 1) fmt.push({
    updateDimensionProperties: {
      range: { sheetId: newSheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: totalCols },
      properties: { pixelSize: 42 },
      fields: 'pixelSize',
    },
  });

  // ── Colour helpers (Catppuccin Mocha palette) ──
  const C = {
    base:    { red: 0.117, green: 0.117, blue: 0.180 }, // #1e1e2e
    mantle:  { red: 0.094, green: 0.094, blue: 0.145 }, // #181825
    surface1:{ red: 0.271, green: 0.278, blue: 0.353 }, // #45475a
    surface0:{ red: 0.191, green: 0.192, blue: 0.282 }, // #313244
    text:    { red: 0.800, green: 0.839, blue: 0.957 }, // #cdd6f4
    subtext: { red: 0.651, green: 0.682, blue: 0.749 }, // #a6adc8
    overlay: { red: 0.424, green: 0.439, blue: 0.525 }, // #6c7086
  };

  const cell = (bg: object, fg: object, opts: object = {}) => ({
    userEnteredFormat: { backgroundColor: bg, textFormat: { foregroundColor: fg, ...opts }, horizontalAlignment: 'CENTER' },
  });

  // Exercise "Exercise" header cell
  fmt.push({ repeatCell: { range: { sheetId: newSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
    cell: { userEnteredFormat: { backgroundColor: C.surface0, textFormat: { bold: true, foregroundColor: C.text } } },
    fields: 'userEnteredFormat(backgroundColor,textFormat)' } });

  // Date header row (alternating groups)
  for (let di = 0; di < dates.length; di++) {
    const c  = 1 + di * colsPerDate;
    const bg = di % 2 === 0 ? C.surface1 : C.surface0;
    fmt.push({ repeatCell: {
      range: { sheetId: newSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: c, endColumnIndex: c + colsPerDate },
      cell: cell(bg, C.text, { bold: true }),
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
    } });
  }

  // Set label + kg/rep header rows
  fmt.push({ repeatCell: {
    range: { sheetId: newSheetId, startRowIndex: 1, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: totalCols },
    cell: cell(C.mantle, C.subtext),
    fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
  } });

  // Data area base
  if (exercises.length > 0) {
    fmt.push({ repeatCell: {
      range: { sheetId: newSheetId, startRowIndex: 3, endRowIndex: totalRows, startColumnIndex: 0, endColumnIndex: totalCols },
      cell: { userEnteredFormat: { backgroundColor: C.base, textFormat: { foregroundColor: C.text }, horizontalAlignment: 'CENTER' } },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
    } });
    // Exercise name column: left-aligned
    fmt.push({ repeatCell: {
      range: { sheetId: newSheetId, startRowIndex: 3, endRowIndex: totalRows, startColumnIndex: 0, endColumnIndex: 1 },
      cell: { userEnteredFormat: { horizontalAlignment: 'LEFT' } },
      fields: 'userEnteredFormat(horizontalAlignment)',
    } });
    // Alternating date-group shading in data rows
    for (let di = 1; di < dates.length; di += 2) {
      const c = 1 + di * colsPerDate;
      fmt.push({ repeatCell: {
        range: { sheetId: newSheetId, startRowIndex: 3, endRowIndex: totalRows, startColumnIndex: c, endColumnIndex: c + colsPerDate },
        cell: { userEnteredFormat: { backgroundColor: C.mantle } },
        fields: 'userEnteredFormat(backgroundColor)',
      } });
    }
  }

  await batchUpdateChunked(token, spreadsheetId, fmt);
}

/**
 * Rebuilds all day-type pivot sheets from the raw data sheet.
 * Safe to call after any data write — idempotent, fire-and-forget friendly.
 */
export async function rebuildPivotSheets(token: string, spreadsheetId: string): Promise<void> {
  // Read raw data
  const raw = await sheetsGet(token, `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(RAW_SHEET)}`);
  const allRows: string[][] = raw.values ?? [];
  if (allRows.length <= 1) return;

  // Parse rows (skip header)
  // Cols: 0=Date 1=Time 2=Day 3=Exercise 4=Set# 5=Weight 6=Reps 7=Volume
  const byDay = new Map<string, PivotRow[]>();
  for (let i = 1; i < allRows.length; i++) {
    const r    = allRows[i];
    const day  = (r[2] ?? '').trim();
    const exer = (r[3] ?? '').trim();
    if (!day || !exer) continue;
    const row: PivotRow = {
      date:     (r[0] ?? '').trim(),
      exercise: exer,
      setNum:   Math.max(1, parseInt(r[4]) || 1),
      weight:   r[5] ?? '',
      reps:     r[6] ?? '',
    };
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(row);
  }

  // Get current sheet list (needed to delete stale pivot sheets before recreating)
  const info = await sheetsGet(token, `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`);
  const existingSheets: { title: string; id: number }[] = (info.sheets ?? []).map(
    (s: { properties: { title: string; sheetId: number } }) => ({
      title: s.properties.title,
      id:    s.properties.sheetId,
    }),
  );

  for (const [dayType, dayRows] of byDay) {
    await buildOnePivotSheet(token, spreadsheetId, dayType, dayRows, existingSheets);
  }
}
