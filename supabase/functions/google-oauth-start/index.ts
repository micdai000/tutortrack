import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  GOOGLE_AUTH_URL,
  GOOGLE_OAUTH_SCOPES,
  corsHeaders,
  getGoogleRedirectUri,
  jsonResponse,
  requireEnv,
} from "../_shared/googleOAuth.ts";

/**
 * Authenticated start of Google OAuth Authorization Code Flow.
 * Returns an authorization URL; tokens never touch the browser.
 */
Deno.serve(async (req) => {
  const headers = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, headers);
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const anonKey = requireEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const googleClientId = requireEnv("GOOGLE_CLIENT_ID");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Not authenticated." }, 401, headers);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Not authenticated." }, 401, headers);
    }

    const stateBytes = new Uint8Array(32);
    crypto.getRandomValues(stateBytes);
    const state = Array.from(stateBytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { error: stateError } = await admin.from("google_oauth_states").insert({
      state,
      user_id: user.id,
      expires_at: expiresAt,
    });

    if (stateError) {
      console.error("Failed to store OAuth state:", stateError);
      return jsonResponse(
        { error: "Unable to start Google authorization." },
        500,
        headers
      );
    }

    const redirectUri = getGoogleRedirectUri();
    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.set("client_id", googleClientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", GOOGLE_OAUTH_SCOPES);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("include_granted_scopes", "true");
    authUrl.searchParams.set("state", state);

    return jsonResponse({ authorizationUrl: authUrl.toString() }, 200, headers);
  } catch (error) {
    console.error("google-oauth-start failed:", error);
    return jsonResponse(
      { error: "Unable to start Google authorization." },
      500,
      headers
    );
  }
});
