import type {
  CategoryEvaluation,
  CategorySessionSignal,
  MeasurableInsightCategory,
} from "../types.ts";

/**
 * Yes/No category engine (Task Completion, Planning).
 * Looks for repeated incomplete / missing-planning responses.
 * One isolated "No" → yellow; repeated → red.
 */
export function evaluateBinaryCategory(
  category: MeasurableInsightCategory,
  label: string,
  concernNoun: string,
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
  const negativeCount = signals.filter(
    (signal) => signal.affirmative === false
  ).length;
  const sessionCount = signals.length;

  if (negativeCount >= 2) {
    return {
      category,
      status: "red",
      reason: `${label} indicated ${concernNoun} in ${negativeCount} of the last ${sessionCount} completed Language Study Sessions.`,
      supportingSessionIds,
    };
  }

  if (negativeCount === 1) {
    return {
      category,
      status: "yellow",
      reason: `${label} indicated ${concernNoun} in 1 of the last ${sessionCount} completed Language Study Sessions. Additional sessions are needed to confirm a pattern.`,
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
