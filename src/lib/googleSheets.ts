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
