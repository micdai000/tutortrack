import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { evaluateAllCategories } from "./engines/registry.ts";
import { buildFollowUpRecommendation } from "./followUpRecommendation.ts";
import type {
  InsightAnswer,
  InsightSession,
  MissionaryInsightsResult,
} from "./types.ts";

const LOOKBACK_SESSION_LIMIT = 3;

type SubmissionQueryRow = {
  id: string;
  submitted_at: string | null;
  created_at: string;
  render_form_answers:
    | Array<{
        insight_category: string | null;
        response_type: string | null;
        response_value: string | null;
      }>
    | null;
};

/**
 * Load the most recent completed Language Study Sessions for a missionary.
 * Uses session count — never calendar days.
 */
async function loadRecentSessions(
  admin: SupabaseClient,
  missionaryId: string
): Promise<InsightSession[]> {
  const { data, error } = await admin
    .from("render_form_submissions")
    .select(
      `
      id,
      submitted_at,
      created_at,
      render_form_answers (
        insight_category,
        response_type,
        response_value
      )
    `
    )
    .eq("missionary_id", missionaryId)
    .eq("match_status", "matched")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(LOOKBACK_SESSION_LIMIT);

  if (error) {
    throw new Error(`INSIGHT_SESSIONS_LOAD_FAILED:${error.message}`);
  }

  const rows = (data ?? []) as SubmissionQueryRow[];

  // Reverse to chronological order (oldest → newest) for trend analysis.
  return rows
    .slice()
    .reverse()
    .map((row) => {
      const answers: InsightAnswer[] = (row.render_form_answers ?? []).map(
        (answer) => ({
          insightCategory: answer.insight_category,
          responseType: answer.response_type,
          responseValue: answer.response_value,
        })
      );

      return {
        submissionId: row.id,
        submittedAt: row.submitted_at ?? row.created_at,
        answers,
      };
    });
}

/** Evaluate all category engines + follow-up recommendation in memory. */
export function evaluateMissionaryInsightsFromSessions(
  missionaryId: string,
  sessionsChronological: InsightSession[],
  evaluatedAt = new Date().toISOString()
): MissionaryInsightsResult {
  const categoryEvaluations = evaluateAllCategories(sessionsChronological);
  const lookbackSessionIds = sessionsChronological.map(
    (session) => session.submissionId
  );
  const followUp = buildFollowUpRecommendation(
    categoryEvaluations,
    lookbackSessionIds
  );

  return {
    missionaryId,
    categoryEvaluations,
    followUp,
    lookbackSessionIds,
    evaluatedAt,
  };
}

/** Persist insight records and follow-up recommendation for one missionary. */
async function persistMissionaryInsights(
  admin: SupabaseClient,
  result: MissionaryInsightsResult
): Promise<void> {
  const evaluatedAt = result.evaluatedAt;

  const insightRows = result.categoryEvaluations.map((evaluation) => ({
    missionary_id: result.missionaryId,
    insight_category: evaluation.category,
    status: evaluation.status,
    reason: evaluation.reason,
    supporting_session_ids: evaluation.supportingSessionIds,
    last_evaluated_at: evaluatedAt,
    updated_at: evaluatedAt,
  }));

  const { error: insightError } = await admin
    .from("missionary_insight_records")
    .upsert(insightRows, { onConflict: "missionary_id,insight_category" });

  if (insightError) {
    throw new Error(`INSIGHT_RECORDS_UPSERT_FAILED:${insightError.message}`);
  }

  const { error: followUpError } = await admin
    .from("missionary_follow_up_recommendations")
    .upsert(
      {
        missionary_id: result.missionaryId,
        is_recommended: result.followUp.isRecommended,
        reason: result.followUp.reason,
        responsible_categories: result.followUp.responsibleCategories,
        recommendation_strength: result.followUp.strength,
        supporting_session_ids: result.followUp.supportingSessionIds,
        last_evaluated_at: evaluatedAt,
        updated_at: evaluatedAt,
      },
      { onConflict: "missionary_id" }
    );

  if (followUpError) {
    throw new Error(
      `FOLLOW_UP_RECOMMENDATION_UPSERT_FAILED:${followUpError.message}`
    );
  }
}

/**
 * Recalculate Missionary Insights for one missionary after a completed session.
 * Only analyzes existing sessions — never calendar gaps or missing submissions.
 */
export async function evaluateAndPersistMissionaryInsights(
  admin: SupabaseClient,
  missionaryId: string
): Promise<MissionaryInsightsResult> {
  const sessions = await loadRecentSessions(admin, missionaryId);
  const result = evaluateMissionaryInsightsFromSessions(
    missionaryId,
    sessions
  );
  await persistMissionaryInsights(admin, result);

  console.log(
    JSON.stringify({
      event: "missionary_insights_evaluated",
      missionary_id: missionaryId,
      session_count: sessions.length,
      statuses: Object.fromEntries(
        result.categoryEvaluations.map((evaluation) => [
          evaluation.category,
          evaluation.status,
        ])
      ),
      follow_up_recommended: result.followUp.isRecommended,
      recommendation_strength: result.followUp.strength,
    })
  );

  return result;
}
