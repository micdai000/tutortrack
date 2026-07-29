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
  last_synced_at?: string | null;
  sync_status?: "up_to_date" | "changes_pending";
  needs_sync?: boolean;
};

export type SyncGoogleFormResult = {
  status: "synced";
  google_form_id: string;
  google_form_url: string;
  google_sheet_id: string | null;
  google_sheet_url: string | null;
  published_at: string | null;
  last_publish_at: string | null;
  last_synced_at: string | null;
  sync_status: "up_to_date" | "changes_pending";
  needs_sync: boolean;
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
    throw new Error("You must be signed in to create your Google Form.");
  }

  const { data, error } = await supabase.functions.invoke("publish-google-form", {
    method: "POST",
  });

  // Supabase often sets `error` for non-2xx while the JSON body is still in `data`
  // (or on error.context). Prefer the Edge Function's tutor-facing message.
  const bodyError = await readFunctionsInvokeError(data, error);
  if (bodyError) {
    throw new Error(bodyError);
  }

  if (error) {
    throw new Error(
      getErrorMessage(error, "Unable to create your Google Form.")
    );
  }

  const result = data as PublishGoogleFormResult | null;
  if (!result?.google_form_id || !result.google_form_url) {
    throw new Error("Unable to create your Google Form.");
  }

  return result;
}

/**
 * Push pending TutorTrack question changes to the existing Google Form.
 * Never creates a second form. Tokens never reach the browser.
 */
export async function syncGoogleForm(): Promise<SyncGoogleFormResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to sync Google Forms.");
  }

  const { data, error } = await supabase.functions.invoke("sync-google-form", {
    method: "POST",
  });

  const bodyError = await readFunctionsInvokeError(data, error);
  if (bodyError) {
    throw new Error(bodyError);
  }

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to sync Google Forms."));
  }

  const result = data as SyncGoogleFormResult | null;
  if (!result?.google_form_id || result.status !== "synced") {
    throw new Error("Unable to sync Google Forms.");
  }

  return result;
}

/** Pull `{ error }` from a Functions invoke failure body when available. */
async function readFunctionsInvokeError(
  data: unknown,
  error: unknown
): Promise<string | null> {
  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.json === "function") {
    try {
      const payload = (await context.json()) as { error?: unknown };
      if (typeof payload?.error === "string" && payload.error.trim()) {
        return payload.error;
      }
    } catch {
      // Ignore unreadable error bodies.
    }
  }

  return null;
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
