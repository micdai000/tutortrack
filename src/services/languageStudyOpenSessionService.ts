import { supabase } from "../lib/supabase";
import { getDistricts } from "./districtService";
import { getRenderAccount } from "./renderAccountService";
import type {
  BeginTodaysRenderResult,
  LanguageStudyOpenSession,
} from "../types/languageStudyOpenSession";
import { getErrorMessage } from "../utils/getErrorMessage";
import { toLocalDateKey } from "../utils/localDate";

function throwQueryError(error: unknown): never {
  throw new Error(getErrorMessage(error, "Unexpected database error."));
}

const OPEN_SESSION_COLUMNS =
  "id, district_id, session_date, status, google_form_url, opened_at, opened_by, created_at, updated_at";

/** Load open sessions for a local calendar date across the tutor's districts. */
export async function getOpenSessionsForDate(
  sessionDate: string
): Promise<LanguageStudyOpenSession[]> {
  const { data, error } = await supabase
    .from("language_study_open_sessions")
    .select(OPEN_SESSION_COLUMNS)
    .eq("session_date", sessionDate)
    .order("opened_at", { ascending: true });

  if (error) throwQueryError(error);
  return (data ?? []) as LanguageStudyOpenSession[];
}

/**
 * Begin today's Render an Account: one OPEN session per active district.
 * Idempotent — never creates a second session for the same district + day.
 */
export async function beginTodaysRenderAccount(
  sessionDate = toLocalDateKey()
): Promise<BeginTodaysRenderResult> {
  const [account, districts] = await Promise.all([
    getRenderAccount(),
    getDistricts(),
  ]);

  if (!account?.google_form_url) {
    throw new Error(
      "Create your Google Form before beginning today's Render an Account."
    );
  }

  if (districts.length === 0) {
    throw new Error(
      "Add at least one district before beginning today's Render an Account."
    );
  }

  const googleFormUrl = account.google_form_url;
  const existing = await getOpenSessionsForDate(sessionDate);
  const existingByDistrict = new Map(
    existing.map((session) => [session.district_id, session])
  );

  const missingDistricts = districts.filter(
    (district) => !existingByDistrict.has(district.id)
  );

  if (missingDistricts.length === 0) {
    return {
      status: "already_begun",
      sessionDate,
      googleFormUrl,
      districtCount: districts.length,
      createdCount: 0,
      sessions: existing,
    };
  }

  const now = new Date().toISOString();
  const rows = missingDistricts.map((district) => ({
    district_id: district.id,
    session_date: sessionDate,
    status: "open" as const,
    google_form_url: googleFormUrl,
    opened_at: now,
    updated_at: now,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("language_study_open_sessions")
    .insert(rows)
    .select(OPEN_SESSION_COLUMNS);

  if (insertError) {
    // Concurrent click / unique constraint — treat as already begun for those rows.
    if (insertError.code === "23505") {
      const refreshed = await getOpenSessionsForDate(sessionDate);
      const createdCount = Math.max(
        0,
        refreshed.length - existing.length
      );
      return {
        status: createdCount > 0 ? "begun" : "already_begun",
        sessionDate,
        googleFormUrl,
        districtCount: districts.length,
        createdCount,
        sessions: refreshed,
      };
    }
    throwQueryError(insertError);
  }

  const created = (inserted ?? []) as LanguageStudyOpenSession[];
  const sessions = [...existing, ...created];

  return {
    status: "begun",
    sessionDate,
    googleFormUrl,
    districtCount: districts.length,
    createdCount: created.length,
    sessions,
  };
}

/** Copy text to the clipboard when the browser allows it. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
