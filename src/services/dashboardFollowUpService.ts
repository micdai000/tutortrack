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

const MEASURABLE_CATEGORIES = new Set<string>([
  "TASK_COMPLETION",
  "STUDY_EFFECTIVENESS",
  "CONFIDENCE",
  "PLANNING",
]);

type InsightRow = {
  id: string;
  missionary_id: string;
  insight_category: string;
  reason: string;
  last_evaluated_at: string;
};

type SubmissionRow = {
  missionary_id: string | null;
  submitted_at: string | null;
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
    .select("id, missionary_id, insight_category, reason, last_evaluated_at")
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

  return redInsights
    .map((row) => {
      const missionary = missionaryById.get(row.missionary_id);
      if (!missionary) return null;

      const latestSubmittedAt = latestSessionByMissionary.get(missionary.id);

      return {
        id: row.id,
        missionaryId: missionary.id,
        missionaryName: missionary.display_name,
        districtId,
        insightCategory: row.insight_category as FollowUpInsightCategory,
        reason: row.reason,
        latestSessionDateKey: latestSubmittedAt
          ? toLocalDateKey(new Date(latestSubmittedAt))
          : null,
      } satisfies DashboardFollowUp;
    })
    .filter((item): item is DashboardFollowUp => item !== null)
    .sort((a, b) => a.missionaryName.localeCompare(b.missionaryName));
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
