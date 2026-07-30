import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
  buildFrontendRedirect,
  getGoogleRedirectUri,
  requireEnv,
  type GoogleTokenResponse,
  type GoogleUserInfo,
} from "../_shared/googleOAuth.ts";

function redirect(result: "connected" | "error", errorCode?: string): Response {
  return Response.redirect(buildFrontendRedirect(result, errorCode), 303);
}

/**
 * Google OAuth callback — exchanges the authorization code server-side
 * and stores tokens in google_connections. Never returns tokens to the browser.
 */
Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const errorParam = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Tutor cancelled or Google returned an error.
  if (errorParam) {
    const mapped =
      errorParam === "access_denied" ? "cancelled" : "google_unavailable";
    return redirect("error", mapped);
  }

  if (!code || !state) {
    return redirect("error", "invalid_state");
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const googleClientId = requireEnv("GOOGLE_CLIENT_ID");
    const googleClientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
    const redirectUri = getGoogleRedirectUri();

    // Temporary debug for token exchange failures (do not log full secret).
    console.log(
      "Token exchange config:",
      "client_id_prefix=",
      googleClientId.slice(0, 20),
      "client_id_suffix=",
      googleClientId.slice(-20),
      "client_id_len=",
      googleClientId.length,
      "secret_len=",
      googleClientSecret.length,
      "secret_prefix=",
      googleClientSecret.slice(0, 6),
      "redirect_uri=",
      redirectUri
    );

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Validate and consume one-time state (binds OAuth to TutorTrack user).
    const { data: stateRow, error: stateLookupError } = await admin
      .from("google_oauth_states")
      .select("state, user_id, expires_at")
      .eq("state", state)
      .maybeSingle();

    if (stateLookupError) {
      console.error("OAuth state lookup failed:", stateLookupError);
      return redirect("error", "invalid_state");
    }

    if (!stateRow) {
      return redirect("error", "invalid_state");
    }

    const { error: deleteStateError } = await admin
      .from("google_oauth_states")
      .delete()
      .eq("state", state);

    if (deleteStateError) {
      console.error("OAuth state delete failed:", deleteStateError);
      return redirect("error", "invalid_state");
    }

    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      return redirect("error", "invalid_state");
    }

    const userId = stateRow.user_id as string;

    // Exchange authorization code for tokens (client secret stays server-side).
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      console.error(
        "Google token exchange failed:",
        tokenResponse.status,
        body
      );

      if (body.includes("invalid_grant")) {
        return redirect("error", "expired_code");
      }

      if (
        body.includes("invalid_client") ||
        body.includes("unauthorized_client")
      ) {
        return redirect("error", "exchange_failed");
      }

      return redirect("error", "exchange_failed");
    }

    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokens.access_token) {
      return redirect("error", "exchange_failed");
    }

    // Confirm Apps Script scopes were actually granted (never log the token).
    console.log("Google OAuth scopes granted:", tokens.scope ?? "(none returned)");

    // Require refresh_token — never store a partial connection.
    if (!tokens.refresh_token) {
      return redirect("error", "missing_refresh_token");
    }

    const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      console.error(
        "Google userinfo failed:",
        profileResponse.status,
        await profileResponse.text()
      );
      return redirect("error", "profile_failed");
    }

    const profile = (await profileResponse.json()) as GoogleUserInfo;

    if (!profile.sub || !profile.email) {
      return redirect("error", "profile_failed");
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + tokens.expires_in * 1000
    ).toISOString();
    const connectedAt = now.toISOString();

    // Upsert only after tokens + profile succeed — no partial records.
    const { error: upsertError } = await admin.from("google_connections").upsert(
      {
        user_id: userId,
        google_email: profile.email,
        google_user_id: profile.sub,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        connected_at: connectedAt,
        updated_at: connectedAt,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      console.error("Failed storing Google connection:", upsertError);
      return redirect("error", "store_failed");
    }

    console.log(
      "Google connection stored for user:",
      userId,
      "email:",
      profile.email
    );

    return redirect("connected");
  } catch (error) {
    console.error("google-oauth-callback failed:", error);
    return redirect("error", "google_unavailable");
  }
});
