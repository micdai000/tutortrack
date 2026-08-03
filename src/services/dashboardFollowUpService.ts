import { supabase } from "../lib/supabase";
import { getCompanionshipsByDistrict } from "./companionshipService";
import type {
  DashboardFollowUp,
  FollowUpInsightCategory,
} from "../types/dashboard";
import { getErrorMessage } from "../utils/getErrorMessage";
import { toLocalDateKey } from "../utils/localDate";

function throwQueryError(error: unknown): never {
  throw new Error(getErrorMessage(error, "Unexpected database error."));
}

type CheckInRow = {
  missionary_id: string;
  insight_category: string;
  acknowledged_last_evaluated_at: string;
};

const MEASURABLE_CATEGORIES = new Set<string>([
  "TASK_COMPLETION",
  "STUDY_EFFECTIVENESS",
  "CONFIDENCE",
  "PLANNING",
  "SUBMISSION_CONSISTENCY",
]);

type InsightRow = {
  id: string;
  missionary_id: string;
  insight_category: string;
  reason: string;
  supporting_session_ids: string[] | null;
  last_evaluated_at: string;
};

type SubmissionRow = {
  missionary_id: string | null;
  submitted_at: string | null;
};

type OpenSessionRow = {
  id: string;
  session_date: string;
};

/**
 * Load RED insight follow-ups for one district.
 * Green and Yellow are excluded — dashboard shows priority only.
 */
export async function getRedFollowUpsForDistrict(
  districtId: string
): Promise<DashboardFollowUp[]> {
  const companionships = await getCompanionshipsByDistrict(districtId);
  const missionaries = companionships.flatMap(
    (companionship) => companionship.missionaries
  );

  if (missionaries.length === 0) {
    return [];
  }

  const missionaryById = new Map(
    missionaries.map((missionary) => [missionary.id, missionary])
  );
  const missionaryIds = missionaries.map((missionary) => missionary.id);

  const { data: insightRows, error: insightError } = await supabase
    .from("missionary_insight_records")
    .select(
      "id, missionary_id, insight_category, reason, supporting_session_ids, last_evaluated_at"
    )
    .eq("status", "red")
    .in("missionary_id", missionaryIds)
    .order("last_evaluated_at", { ascending: false });

  if (insightError) throwQueryError(insightError);

  const redInsights = ((insightRows ?? []) as InsightRow[]).filter((row) =>
    MEASURABLE_CATEGORIES.has(row.insight_category)
  );

  if (redInsights.length === 0) {
    return [];
  }

  const { data: checkInRows, error: checkInError } = await supabase
    .from("missionary_insight_check_ins")
    .select("missionary_id, insight_category, acknowledged_last_evaluated_at")
    .in("missionary_id", missionaryIds);

  if (checkInError) throwQueryError(checkInError);

  const checkInByKey = new Map(
    ((checkInRows ?? []) as CheckInRow[]).map((row) => [
      `${row.missionary_id}:${row.insight_category}`,
      row.acknowledged_last_evaluated_at,
    ])
  );

  const uncheckedInsights = redInsights.filter((row) => {
    const acknowledgedAt = checkInByKey.get(
      `${row.missionary_id}:${row.insight_category}`
    );
    if (!acknowledgedAt) return true;
    return (
      new Date(acknowledgedAt).getTime() !==
      new Date(row.last_evaluated_at).getTime()
    );
  });

  if (uncheckedInsights.length === 0) {
    return [];
  }

  const { data: submissionRows, error: submissionError } = await supabase
    .from("render_form_submissions")
    .select("missionary_id, submitted_at")
    .in("missionary_id", missionaryIds)
    .eq("match_status", "matched")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false });

  if (submissionError) throwQueryError(submissionError);

  const latestSessionByMissionary = new Map<string, string>();
  for (const row of (submissionRows ?? []) as SubmissionRow[]) {
    if (!row.missionary_id || !row.submitted_at) continue;
    if (latestSessionByMissionary.has(row.missionary_id)) continue;
    latestSessionByMissionary.set(row.missionary_id, row.submitted_at);
  }

  const openSessionIds = Array.from(
    new Set(
      uncheckedInsights
        .filter((row) => row.insight_category === "SUBMISSION_CONSISTENCY")
        .flatMap((row) => row.supporting_session_ids ?? [])
    )
  );

  const missedDateByOpenSessionId = new Map<string, string>();
  if (openSessionIds.length > 0) {
    const { data: openSessions, error: openSessionError } = await supabase
      .from("language_study_open_sessions")
      .select("id, session_date")
      .in("id", openSessionIds);

    if (openSessionError) throwQueryError(openSessionError);

    for (const row of (openSessions ?? []) as OpenSessionRow[]) {
      missedDateByOpenSessionId.set(row.id, row.session_date);
    }
  }

  return uncheckedInsights
    .map((row) => {
      const missionary = missionaryById.get(row.missionary_id);
      if (!missionary) return null;

      let latestSessionDateKey: string | null = null;

      if (row.insight_category === "SUBMISSION_CONSISTENCY") {
        const missedDates = (row.supporting_session_ids ?? [])
          .map((id) => missedDateByOpenSessionId.get(id))
          .filter((dateKey): dateKey is string => Boolean(dateKey))
          .sort((a, b) => b.localeCompare(a));
        latestSessionDateKey = missedDates[0] ?? null;
      } else {
        const latestSubmittedAt = latestSessionByMissionary.get(missionary.id);
        latestSessionDateKey = latestSubmittedAt
          ? toLocalDateKey(new Date(latestSubmittedAt))
          : null;
      }

      return {
        id: row.id,
        missionaryId: missionary.id,
        missionaryName: missionary.display_name,
        districtId,
        insightCategory: row.insight_category as FollowUpInsightCategory,
        reason: row.reason,
        lastEvaluatedAt: row.last_evaluated_at,
        latestSessionDateKey,
      } satisfies DashboardFollowUp;
    })
    .filter((item): item is DashboardFollowUp => item !== null)
    .sort((a, b) => a.missionaryName.localeCompare(b.missionaryName));
}

/**
 * Mark a Missionaries in Need check-in complete for the current insight state.
 * The card stays hidden until that insight is re-evaluated.
 */
export async function markInsightCheckInComplete(
  followUp: DashboardFollowUp
): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to complete a check-in.");
  }

  const { error } = await supabase.from("missionary_insight_check_ins").upsert(
    {
      insight_record_id: followUp.id,
      missionary_id: followUp.missionaryId,
      insight_category: followUp.insightCategory,
      acknowledged_last_evaluated_at: followUp.lastEvaluatedAt,
      completed_at: new Date().toISOString(),
      completed_by: session.user.id,
    },
    { onConflict: "missionary_id,insight_category" }
  );

  if (error) throwQueryError(error);
}

/** Build Language Study Sessions deep-link for a follow-up card. */
export function buildLanguageStudySessionHref(followUp: DashboardFollowUp): string {
  const params = new URLSearchParams({
    districtId: followUp.districtId,
    missionaryId: followUp.missionaryId,
  });

  if (followUp.latestSessionDateKey) {
    params.set("date", followUp.latestSessionDateKey);
  }

  return `/language-study-sessions?${params.toString()}`;
}
