/// <reference types="vite/client" />

interface GoogleOAuthTokenResponse {
  access_token: string;
  expires_in:   number;
  token_type:   string;
  scope:        string;
  error?:       string;
}

interface GoogleTokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient(config: {
          client_id:       string;
          scope:           string;
          callback:        (resp: GoogleOAuthTokenResponse) => void;
          error_callback?: (err: { type: string; message?: string }) => void;
        }): GoogleTokenClient;
      };
    };
  };
}
