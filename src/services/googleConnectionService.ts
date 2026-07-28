import { supabase } from "../lib/supabase";
import type { GoogleConnectionSummary } from "../types/googleConnection";
import { getErrorMessage } from "../utils/getErrorMessage";

/** Convert Supabase/PostgREST plain error objects into real Error instances. */
function throwQueryError(error: unknown): never {
  throw new Error(getErrorMessage(error, "Unexpected database error."));
}

/** Columns safe for the client UI (excludes access/refresh tokens). */
const SUMMARY_COLUMNS =
  "id, user_id, google_email, google_user_id, expires_at, connected_at, updated_at";

/** Fetch the signed-in tutor's Google connection summary (null if none). */
export async function getGoogleConnection(): Promise<GoogleConnectionSummary | null> {
  const { data, error } = await supabase
    .from("google_connections")
    .select(SUMMARY_COLUMNS)
    .maybeSingle();

  if (error) throwQueryError(error);
  return data;
}

/**
 * Start Google OAuth via Edge Function.
 * Returns the Google authorization URL (tokens never reach the browser).
 */
export async function startGoogleOAuth(): Promise<string> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to connect Google.");
  }

  const { data, error } = await supabase.functions.invoke("google-oauth-start", {
    method: "POST",
  });

  if (error) {
    throw new Error(
      getErrorMessage(error, "Unable to start Google authorization.")
    );
  }

  const authorizationUrl =
    data && typeof data === "object" && "authorizationUrl" in data
      ? String((data as { authorizationUrl?: unknown }).authorizationUrl ?? "")
      : "";

  if (!authorizationUrl) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error?: unknown }).error ?? "")
        : "";
    throw new Error(
      message || "Unable to start Google authorization."
    );
  }

  return authorizationUrl;
}

/** Remove the signed-in tutor's Google connection. */
export async function deleteGoogleConnection(): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to disconnect Google.");
  }

  const { error } = await supabase
    .from("google_connections")
    .delete()
    .eq("user_id", session.user.id);

  if (error) throwQueryError(error);
}

export type PublishGoogleFormResult = {
  status: "published" | "already_published";
  google_form_id: string;
  google_form_url: string;
  google_sheet_id: string | null;
  google_sheet_url: string | null;
  published_at: string | null;
  last_publish_at: string | null;
};

/**
 * Create the tutor's permanent Google Form + Responses sheet via Edge Function.
 * Tokens never reach the browser.
 */
export async function publishGoogleForm(): Promise<PublishGoogleFormResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to publish to Google Forms.");
  }

  const { data, error } = await supabase.functions.invoke("publish-google-form", {
    method: "POST",
  });

  if (error) {
    throw new Error(
      getErrorMessage(error, "Unable to publish to Google Forms.")
    );
  }

  if (data && typeof data === "object" && "error" in data) {
    throw new Error(
      String((data as { error?: unknown }).error ?? "Unable to publish to Google Forms.")
    );
  }

  const result = data as PublishGoogleFormResult | null;
  if (!result?.google_form_id || !result.google_form_url) {
    throw new Error("Unable to publish to Google Forms.");
  }

  return result;
}

/** Map OAuth redirect error codes to tutor-facing messages. */
export function getGoogleOAuthErrorMessage(errorCode: string | null): string {
  switch (errorCode) {
    case "cancelled":
      return "Google authorization was cancelled.";
    case "invalid_state":
      return "Google authorization could not be verified. Please try again.";
    case "expired_code":
      return "The Google authorization code expired. Please try again.";
    case "exchange_failed":
      return "TutorTrack could not complete Google authorization. Please try again.";
    case "missing_refresh_token":
      return "Google did not grant offline access. Please try again and allow the requested permissions.";
    case "profile_failed":
      return "TutorTrack could not read your Google account profile. Please try again.";
    case "store_failed":
      return "TutorTrack could not save your Google connection. Please try again.";
    case "google_unavailable":
      return "Google is temporarily unavailable. Please try again later.";
    default:
      return "Google authorization failed. Please try again.";
  }
}
