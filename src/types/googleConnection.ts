/**
 * A tutor's Google OAuth connection (independent of Supabase Auth).
 * Tokens are written only by Edge Functions with the service role.
 * The browser never receives access or refresh tokens.
 */
export type GoogleConnection = {
  id: string;
  user_id: string;
  google_email: string;
  google_user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  connected_at: string;
  updated_at: string;
};

/**
 * Safe fields for UI and client reads.
 * Tokens are omitted so the editor never displays or holds secrets.
 */
export type GoogleConnectionSummary = {
  id: string;
  user_id: string;
  google_email: string;
  google_user_id: string;
  expires_at: string;
  connected_at: string;
  updated_at: string;
};
