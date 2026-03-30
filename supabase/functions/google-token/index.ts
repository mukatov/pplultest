const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const CLIENT_ID     = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

    const { code, codeVerifier, redirectUri, refreshToken } = await req.json();

    const body: Record<string, string> = refreshToken
      ? {
          client_id:     CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type:    'refresh_token',
        }
      : {
          client_id:     CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          code_verifier: codeVerifier,
          grant_type:    'authorization_code',
          redirect_uri:  redirectUri,
        };

    const res  = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams(body),
    });
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status:  500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
