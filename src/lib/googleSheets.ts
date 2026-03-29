// ─── Google Sheets integration ────────────────────────────────────────────────
// Requires VITE_GOOGLE_CLIENT_ID in .env.local
// Setup: Google Cloud Console → OAuth2 Web client → add <origin>/callback-popup.html as redirect URI

const CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '432754734536-bvvmjh2vobv0hg45rk0drbt06t3oa0fv.apps.googleusercontent.com';
const SCOPES       = 'https://www.googleapis.com/auth/spreadsheets';
const REDIRECT_URI = () => `${window.location.origin}${import.meta.env.BASE_URL}callback-popup.html`;
const SHEETS_API   = 'https://sheets.googleapis.com/v4/spreadsheets';
const TOKEN_URL    = 'https://oauth2.googleapis.com/token';

export const hasGoogleClientId = !!CLIENT_ID;

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function randomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

async function sha256b64url(plain: string) {
  const data = new TextEncoder().encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── OAuth popup flow ─────────────────────────────────────────────────────────

export interface OAuthResult {
  accessToken:  string;
  refreshToken: string | null;
  expiresIn:    number;
}

export async function startGoogleOAuth(): Promise<OAuthResult> {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID not set');

  const verifier   = randomString(64);
  const challenge  = await sha256b64url(verifier);

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    redirect_uri:          REDIRECT_URI(),
    response_type:         'code',
    scope:                 SCOPES,
    access_type:           'offline',
    prompt:                'consent',
    code_challenge:        challenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  return new Promise((resolve, reject) => {
    const popup = window.open(authUrl, 'google-oauth', 'width=520,height=640,left=200,top=80');
    if (!popup) { reject(new Error('Popup blocked — allow popups and try again')); return; }

    // Watch for postMessage from the popup
    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== 'google-oauth') return;
      cleanup();

      if (event.data.error) { reject(new Error(event.data.error)); return; }
      const code = event.data.code as string;

      try {
        const res  = await fetch(TOKEN_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body:    new URLSearchParams({
            client_id:     CLIENT_ID!,
            code,
            code_verifier: verifier,
            grant_type:    'authorization_code',
            redirect_uri:  REDIRECT_URI(),
          }),
        });
        const data = await res.json();
        if (data.error) { reject(new Error(data.error_description ?? data.error)); return; }
        resolve({ accessToken: data.access_token, refreshToken: data.refresh_token ?? null, expiresIn: data.expires_in });
      } catch (e) { reject(e); }
    };

    // Detect popup being closed without completing
    const pollClosed = setInterval(() => {
      if (popup.closed) { cleanup(); reject(new Error('cancelled')); }
    }, 500);

    const cleanup = () => {
      clearInterval(pollClosed);
      window.removeEventListener('message', onMessage);
    };

    window.addEventListener('message', onMessage);
  });
}

// ─── Token refresh ────────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const res  = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      client_id:     CLIENT_ID!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
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
