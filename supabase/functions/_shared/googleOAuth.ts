/** Shared Google OAuth helpers for TutorTrack Edge Functions. */

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL =
  "https://www.googleapis.com/oauth2/v3/userinfo";

/**
 * Scopes for Google Forms publish/sync, response sheets, and Apps Script
 * response-pipeline install (Stage 3A).
 */
export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/forms.body",
  "https://www.googleapis.com/auth/forms",
  "https://www.googleapis.com/auth/forms.responses.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/script.projects",
  "https://www.googleapis.com/auth/script.deployments",
  "https://www.googleapis.com/auth/script.scriptapp",
  "https://www.googleapis.com/auth/script.external_request",
].join(" ");

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export function requireEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSiteUrl(): string {
  return requireEnv("SITE_URL").replace(/\/$/, "");
}

export function getGoogleRedirectUri(): string {
  const configured = Deno.env.get("GOOGLE_REDIRECT_URI")?.trim();
  if (configured) {
    return configured;
  }

  const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  return `${supabaseUrl}/functions/v1/google-oauth-callback`;
}

export function buildFrontendRedirect(
  result: "connected" | "error",
  errorCode?: string
): string {
  const url = new URL(`${getSiteUrl()}/render-account`);
  url.searchParams.set("google_oauth", result);
  if (result === "error" && errorCode) {
    url.searchParams.set("google_oauth_error", errorCode);
  }
  return url.toString();
}

export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("Origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
