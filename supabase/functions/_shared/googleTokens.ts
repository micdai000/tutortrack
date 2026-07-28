import {
  GOOGLE_TOKEN_URL,
  requireEnv,
  type GoogleTokenResponse,
} from "./googleOAuth.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export type StoredGoogleConnection = {
  id: string;
  user_id: string;
  google_email: string;
  google_user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
};

/** Create a service-role Supabase client. */
export function createServiceClient(): SupabaseClient {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

/**
 * Return a valid access token for the tutor's Google connection.
 * Refreshes and persists tokens when expired (60s skew).
 */
export async function getValidGoogleAccessToken(
  admin: SupabaseClient,
  userId: string
): Promise<{ accessToken: string; connection: StoredGoogleConnection }> {
  const { data: connection, error } = await admin
    .from("google_connections")
    .select(
      "id, user_id, google_email, google_user_id, access_token, refresh_token, expires_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load Google connection: ${error.message}`);
  }

  if (!connection) {
    throw new Error("NOT_CONNECTED");
  }

  const typed = connection as StoredGoogleConnection;
  const expiresAt = new Date(typed.expires_at).getTime();
  const stillValid = expiresAt - Date.now() > 60_000;

  if (stillValid) {
    return { accessToken: typed.access_token, connection: typed };
  }

  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: typed.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    console.error("Google token refresh failed:", tokenResponse.status, body);
    throw new Error("TOKEN_REFRESH_FAILED");
  }

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokens.access_token || !tokens.expires_in) {
    throw new Error("TOKEN_REFRESH_FAILED");
  }

  const newExpiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();
  const newRefreshToken = tokens.refresh_token ?? typed.refresh_token;

  const { error: updateError } = await admin
    .from("google_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: newRefreshToken,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", typed.id);

  if (updateError) {
    console.error("Failed persisting refreshed Google tokens:", updateError);
    // Still return the fresh access token for this request.
  }

  return {
    accessToken: tokens.access_token,
    connection: {
      ...typed,
      access_token: tokens.access_token,
      refresh_token: newRefreshToken,
      expires_at: newExpiresAt,
    },
  };
}

/** Delete a Drive file (form or sheet) during rollback. Best-effort. */
export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 404) {
    console.error(
      "Drive delete failed:",
      fileId,
      response.status,
      await response.text()
    );
  }
}
