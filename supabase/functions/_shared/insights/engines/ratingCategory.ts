import {
  isLowScore,
  isMaterialDecline,
  isStrictlyDeclining,
} from "../parseAnswers.ts";
import type {
  CategoryEvaluation,
  CategorySessionSignal,
  MeasurableInsightCategory,
} from "../types.ts";

/**
 * Rating (1–10) category engine (Study Effectiveness, Confidence).
 * Prioritizes sustained lows and downward trends over isolated scores.
 */
export function evaluateRatingCategory(
  category: MeasurableInsightCategory,
  label: string,
  signals: CategorySessionSignal[]
): CategoryEvaluation {
  if (signals.length === 0) {
    return {
      category,
      status: "green",
      reason: `No ${label} responses were available in recent completed Language Study Sessions.`,
      supportingSessionIds: [],
    };
  }

  const supportingSessionIds = signals.map((signal) => signal.submissionId);
  const scores = signals.map((signal) => signal.score!);
  const sessionCount = scores.length;
  const lowCount = scores.filter((score) => isLowScore(score)).length;
  const latestScore = scores[scores.length - 1]!;
  const strictlyDeclining = isStrictlyDeclining(scores);
  const materialDecline = isMaterialDecline(scores);

  // Sustained low across 2+ sessions → red
  if (sessionCount >= 2 && lowCount === sessionCount) {
    return {
      category,
      status: "red",
      reason: `${label} remained below 5 during the last ${sessionCount} completed Language Study Sessions.`,
      supportingSessionIds,
    };
  }

  // Clear downward trend ending low → red
  if (
    sessionCount >= 3 &&
    (strictlyDeclining || materialDecline) &&
    isLowScore(latestScore)
  ) {
    return {
      category,
      status: "red",
      reason: `${label} has steadily declined across the last three completed sessions.`,
      supportingSessionIds,
    };
  }

  // Material decline across lookback (e.g. 10 → 8 → 6) → yellow
  if (sessionCount >= 3 && (strictlyDeclining || materialDecline)) {
    return {
      category,
      status: "yellow",
      reason: `${label} has declined across the last three completed Language Study Sessions.`,
      supportingSessionIds,
    };
  }

  // Isolated low among otherwise non-low scores → yellow (not red)
  if (lowCount === 1 && sessionCount >= 2) {
    return {
      category,
      status: "yellow",
      reason: `One recent ${label} score was below 5 across the last ${sessionCount} completed Language Study Sessions. This is not yet a sustained pattern.`,
      supportingSessionIds,
    };
  }

  // Single session low → yellow; needs more sessions to confirm
  if (sessionCount === 1 && isLowScore(latestScore)) {
    return {
      category,
      status: "yellow",
      reason: `Most recent ${label} score was below 5. Additional completed Language Study Sessions are needed to confirm a pattern.`,
      supportingSessionIds,
    };
  }

  // Mild two-session decline ending near low → yellow
  if (
    sessionCount === 2 &&
    materialDecline &&
    latestScore <= 6
  ) {
    return {
      category,
      status: "yellow",
      reason: `${label} declined across the last two completed Language Study Sessions.`,
      supportingSessionIds,
    };
  }

  return {
    category,
    status: "green",
    reason: `${label} shows no sustained concern across the last ${sessionCount} completed Language Study Sessions.`,
    supportingSessionIds,
  };
}
