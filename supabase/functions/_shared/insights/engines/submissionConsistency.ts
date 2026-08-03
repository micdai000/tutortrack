import type { InsightStatus } from "../types.ts";

export const SUBMISSION_CONSISTENCY_CATEGORY = "SUBMISSION_CONSISTENCY" as const;

export type OpenSessionDay = {
  id: string;
  sessionDate: string;
};

export type SubmissionConsistencyEvaluation = {
  category: typeof SUBMISSION_CONSISTENCY_CATEGORY;
  status: InsightStatus;
  reason: string;
  /** Open session row ids for missed days (newest first). */
  supportingOpenSessionIds: string[];
  /** Most recent missed opened session date (YYYY-MM-DD), if any. */
  latestMissedDateKey: string | null;
};

/**
 * Flag missionaries who miss consecutive opened Render an Account days.
 * Uses the last two fully elapsed opened session days for the district.
 * - Missed both → red (dashboard follow-up)
 * - Missed one → yellow
 * - Submitted both / insufficient history → green
 */
export function evaluateSubmissionConsistency(
  lookbackDays: OpenSessionDay[],
  submittedDateKeys: Set<string>
): SubmissionConsistencyEvaluation {
  if (lookbackDays.length < 2) {
    return {
      category: SUBMISSION_CONSISTENCY_CATEGORY,
      status: "green",
      reason:
        "Not enough opened Language Study Session days yet to evaluate submission consistency.",
      supportingOpenSessionIds: [],
      latestMissedDateKey: null,
    };
  }

  const missedDays = lookbackDays.filter(
    (day) => !submittedDateKeys.has(day.sessionDate)
  );
  const supportingOpenSessionIds = missedDays.map((day) => day.id);
  const latestMissedDateKey = missedDays[0]?.sessionDate ?? null;

  if (missedDays.length >= 2) {
    return {
      category: SUBMISSION_CONSISTENCY_CATEGORY,
      status: "red",
      reason:
        "No Render an Account submission on the last 2 opened Language Study Session days.",
      supportingOpenSessionIds,
      latestMissedDateKey,
    };
  }

  if (missedDays.length === 1) {
    const missed = missedDays[0]!;
    return {
      category: SUBMISSION_CONSISTENCY_CATEGORY,
      status: "yellow",
      reason: `No Render an Account submission on 1 of the last 2 opened Language Study Session days (${missed.sessionDate}). One more consecutive miss will create a follow-up.`,
      supportingOpenSessionIds,
      latestMissedDateKey,
    };
  }

  return {
    category: SUBMISSION_CONSISTENCY_CATEGORY,
    status: "green",
    reason:
      "Submitted Render an Account on the last 2 opened Language Study Session days.",
    supportingOpenSessionIds: [],
    latestMissedDateKey: null,
  };
}

/** Format an instant as YYYY-MM-DD in the given IANA time zone. */
export function toDateKeyInTimeZone(
  isoTimestamp: string,
  timeZone: string
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoTimestamp));
}

/** Today's YYYY-MM-DD in the given IANA time zone. */
export function todayDateKeyInTimeZone(
  timeZone: string,
  now = new Date()
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
