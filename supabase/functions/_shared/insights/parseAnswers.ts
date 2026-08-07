import type { CategorySessionSignal, InsightSession } from "./types.ts";
import type { MeasurableInsightCategory } from "./types.ts";

/** Threshold for decline / isolated-low signals (exclusive): scores below this are low. */
const LOW_SCORE_THRESHOLD = 5;

/**
 * Max score that still counts as low for the sustained-all-low red rule (inclusive).
 * Study Effectiveness / Confidence: every lookback score at or below this → red.
 */
const SUSTAINED_LOW_MAX = 6;

/** Scores below 5 are considered low (decline ending low, isolated yellow). */
export function isLowScore(score: number): boolean {
  return score < LOW_SCORE_THRESHOLD;
}

/** Scores 1–6 count as low for the sustained-all-low red pattern. */
export function isSustainedLowScore(score: number): boolean {
  return score <= SUSTAINED_LOW_MAX;
}

/** Parse a YES_NO response_value into affirmative (Yes) / negative (No). */
export function parseYesNo(
  value: string | null | undefined
): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "yes" || normalized === "y" || normalized === "true") {
    return true;
  }
  if (normalized === "no" || normalized === "n" || normalized === "false") {
    return false;
  }
  return null;
}

/** Parse a RATING_1_TO_10 response_value into an integer 1–10. */
export function parseRating(
  value: string | null | undefined
): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.trim());
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1 || parsed > 10) return null;
  return parsed;
}

/**
 * Build one signal per session that has at least one usable answer
 * for the category. Sessions without that category are skipped
 * (never fabricated).
 */
export function buildCategorySignals(
  sessionsChronological: InsightSession[],
  category: MeasurableInsightCategory,
  kind: "binary" | "rating"
): CategorySessionSignal[] {
  const signals: CategorySessionSignal[] = [];

  for (const session of sessionsChronological) {
    const categoryAnswers = session.answers.filter(
      (answer) => answer.insightCategory === category
    );

    if (categoryAnswers.length === 0) continue;

    if (kind === "binary") {
      const parsed = categoryAnswers
        .map((answer) => parseYesNo(answer.responseValue))
        .filter((value): value is boolean => value !== null);

      if (parsed.length === 0) continue;

      // Any "No" means incomplete / no planning for that session.
      const affirmative = parsed.every((value) => value === true);

      signals.push({
        submissionId: session.submissionId,
        submittedAt: session.submittedAt,
        affirmative,
      });
      continue;
    }

    const scores = categoryAnswers
      .map((answer) => parseRating(answer.responseValue))
      .filter((value): value is number => value !== null);

    if (scores.length === 0) continue;

    // Conservative session aggregate: lowest score for the category.
    const score = Math.min(...scores);

    signals.push({
      submissionId: session.submissionId,
      submittedAt: session.submittedAt,
      score,
    });
  }

  return signals;
}

/** True when each score is strictly lower than the previous (oldest → newest). */
export function isStrictlyDeclining(scores: number[]): boolean {
  if (scores.length < 2) return false;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i]! >= scores[i - 1]!) return false;
  }
  return true;
}

/**
 * Material non-increasing decline of at least 3 points from oldest to newest.
 * Example: 10 → 8 → 6.
 */
export function isMaterialDecline(scores: number[]): boolean {
  if (scores.length < 2) return false;
  const drop = scores[0]! - scores[scores.length - 1]!;
  if (drop < 3) return false;

  for (let i = 1; i < scores.length; i++) {
    if (scores[i]! > scores[i - 1]!) return false;
  }
  return true;
}
