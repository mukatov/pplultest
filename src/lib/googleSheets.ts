// ─── Google Sheets integration ────────────────────────────────────────────────
// Token exchange handled by Supabase edge function (secret never in browser).
// OAuth uses redirect flow instead of popup (PWA compatible).

const CLIENT_ID    = '432754734536-bvvmjh2vobv0hg45rk0drbt06t3oa0fv.apps.googleusercontent.com';
const SCOPES       = 'https://www.googleapis.com/auth/spreadsheets';
const SHEETS_API   = 'https://sheets.googleapis.com/v4/spreadsheets';
const EDGE_FN_URL  = 'https://qdliyanbtrukhjwdlffn.supabase.co/functions/v1/google-token';

const REDIRECT_URI = () => `${window.location.origin}${import.meta.env.BASE_URL}callback-popup.html`;

export const hasGoogleClientId = true;

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function randomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

// ─── OAuth redirect flow ──────────────────────────────────────────────────────

/** Saves PKCE verifier + current URL, then redirects to Google consent screen. */
export async function startGoogleOAuth(): Promise<void> {
  const verifier = randomString(64);

  sessionStorage.setItem('google_oauth_verifier', verifier);
  sessionStorage.setItem('google_oauth_return',   window.location.href);

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    redirect_uri:          REDIRECT_URI(),
    response_type:         'code',
    scope:                 SCOPES,
    access_type:           'offline',
    prompt:                'consent',
    code_challenge:        verifier,
    code_challenge_method: 'plain',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ─── Token exchange via edge function ─────────────────────────────────────────

export interface OAuthResult {
  accessToken:  string;
  refreshToken: string | null;
  expiresIn:    number;
}

/** Exchange an auth code (+ PKCE verifier) for tokens via the edge function. */
export async function exchangeCode(code: string, codeVerifier: string): Promise<OAuthResult> {
  const res  = await fetch(EDGE_FN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ code, codeVerifier, redirectUri: REDIRECT_URI() }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description ?? data.error);
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, expiresIn: data.expires_in };
}

/** Refresh an access token via the edge function. */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const res  = await fetch(EDGE_FN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description ?? data.error);
  return { accessToken: data.access_token, expiresIn: data.expires_in };
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
