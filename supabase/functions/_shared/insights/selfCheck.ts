/**
 * Lightweight Stage 3C evaluation checks (Deno).
 * Run: deno run --allow-env supabase/functions/_shared/insights/selfCheck.ts
 */

import { evaluateMissionaryInsightsFromSessions } from "./evaluateMissionaryInsights.ts";
import type { InsightSession } from "./types.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function session(
  id: string,
  answers: InsightSession["answers"]
): InsightSession {
  return {
    submissionId: id,
    submittedAt: `2026-01-0${id}T12:00:00.000Z`,
    answers,
  };
}

// Sustained low confidence → red
{
  const result = evaluateMissionaryInsightsFromSessions("m1", [
    session("1", [
      {
        insightCategory: "CONFIDENCE",
        responseType: "RATING_1_TO_10",
        responseValue: "3",
      },
    ]),
    session("2", [
      {
        insightCategory: "CONFIDENCE",
        responseType: "RATING_1_TO_10",
        responseValue: "4",
      },
    ]),
    session("3", [
      {
        insightCategory: "CONFIDENCE",
        responseType: "RATING_1_TO_10",
        responseValue: "2",
      },
    ]),
  ]);

  const confidence = result.categoryEvaluations.find(
    (evaluation) => evaluation.category === "CONFIDENCE"
  )!;
  assert(confidence.status === "red", `expected red, got ${confidence.status}`);
  assert(
    confidence.reason.includes("below 5"),
    `unexpected reason: ${confidence.reason}`
  );
}

// Isolated low score → yellow, not red
{
  const result = evaluateMissionaryInsightsFromSessions("m2", [
    session("1", [
      {
        insightCategory: "STUDY_EFFECTIVENESS",
        responseType: "RATING_1_TO_10",
        responseValue: "8",
      },
    ]),
    session("2", [
      {
        insightCategory: "STUDY_EFFECTIVENESS",
        responseType: "RATING_1_TO_10",
        responseValue: "3",
      },
    ]),
    session("3", [
      {
        insightCategory: "STUDY_EFFECTIVENESS",
        responseType: "RATING_1_TO_10",
        responseValue: "9",
      },
    ]),
  ]);

  const study = result.categoryEvaluations.find(
    (evaluation) => evaluation.category === "STUDY_EFFECTIVENESS"
  )!;
  assert(study.status === "yellow", `expected yellow, got ${study.status}`);
}

// Decline 10 → 8 → 6 → yellow
{
  const result = evaluateMissionaryInsightsFromSessions("m3", [
    session("1", [
      {
        insightCategory: "CONFIDENCE",
        responseType: "RATING_1_TO_10",
        responseValue: "10",
      },
    ]),
    session("2", [
      {
        insightCategory: "CONFIDENCE",
        responseType: "RATING_1_TO_10",
        responseValue: "8",
      },
    ]),
    session("3", [
      {
        insightCategory: "CONFIDENCE",
        responseType: "RATING_1_TO_10",
        responseValue: "6",
      },
    ]),
  ]);

  const confidence = result.categoryEvaluations.find(
    (evaluation) => evaluation.category === "CONFIDENCE"
  )!;
  assert(
    confidence.status === "yellow",
    `expected yellow decline, got ${confidence.status}`
  );
  assert(
    confidence.reason.includes("declined"),
    `unexpected reason: ${confidence.reason}`
  );
}

// Repeated incomplete task completion → red + mild follow-up alone
{
  const result = evaluateMissionaryInsightsFromSessions("m4", [
    session("1", [
      {
        insightCategory: "TASK_COMPLETION",
        responseType: "YES_NO",
        responseValue: "No",
      },
    ]),
    session("2", [
      {
        insightCategory: "TASK_COMPLETION",
        responseType: "YES_NO",
        responseValue: "No",
      },
    ]),
    session("3", [
      {
        insightCategory: "TASK_COMPLETION",
        responseType: "YES_NO",
        responseValue: "Yes",
      },
    ]),
  ]);

  const task = result.categoryEvaluations.find(
    (evaluation) => evaluation.category === "TASK_COMPLETION"
  )!;
  assert(task.status === "red", `expected red, got ${task.status}`);
  assert(result.followUp.isRecommended === true, "expected follow-up");
  assert(
    result.followUp.strength === "mild",
    `expected mild isolated red, got ${result.followUp.strength}`
  );
}

// Agreement across categories → strong
{
  const result = evaluateMissionaryInsightsFromSessions("m5", [
    session("1", [
      {
        insightCategory: "TASK_COMPLETION",
        responseType: "YES_NO",
        responseValue: "No",
      },
      {
        insightCategory: "CONFIDENCE",
        responseType: "RATING_1_TO_10",
        responseValue: "3",
      },
    ]),
    session("2", [
      {
        insightCategory: "TASK_COMPLETION",
        responseType: "YES_NO",
        responseValue: "No",
      },
      {
        insightCategory: "CONFIDENCE",
        responseType: "RATING_1_TO_10",
        responseValue: "2",
      },
    ]),
  ]);

  assert(result.followUp.strength === "strong", "expected strong agreement");
  assert(result.followUp.isRecommended === true, "expected recommendation");
}

// Missing category answers are skipped (not fabricated)
{
  const result = evaluateMissionaryInsightsFromSessions("m6", [
    session("1", [
      {
        insightCategory: "NONE",
        responseType: "SHORT_TEXT",
        responseValue: "notes only",
      },
    ]),
  ]);

  const planning = result.categoryEvaluations.find(
    (evaluation) => evaluation.category === "PLANNING"
  )!;
  assert(planning.status === "green", "no data should stay green");
  assert(
    planning.reason.includes("No Planning responses"),
    planning.reason
  );
  assert(result.followUp.isRecommended === false, "no follow-up without signals");
}

console.log("Stage 3C insight self-check passed.");
