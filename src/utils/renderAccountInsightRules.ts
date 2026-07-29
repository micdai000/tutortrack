import type { InsightCategory, ResponseType } from "../types/renderAccount";

/**
 * Insight categories allowed for each response type.
 * Invalid combinations are prevented in the editor UI (not shown as errors).
 */
export const INSIGHT_CATEGORIES_BY_RESPONSE_TYPE: Record<
  ResponseType,
  readonly InsightCategory[]
> = {
  YES_NO: ["NONE", "TASK_COMPLETION", "PLANNING"],
  RATING_1_TO_10: ["NONE", "STUDY_EFFECTIVENESS", "CONFIDENCE"],
  SHORT_TEXT: ["NONE"],
  PARAGRAPH: ["NONE"],
};

/** True when the insight category is allowed for the response type. */
export function isInsightCategoryAllowed(
  responseType: ResponseType,
  insightCategory: InsightCategory
): boolean {
  return INSIGHT_CATEGORIES_BY_RESPONSE_TYPE[responseType].includes(
    insightCategory
  );
}

/**
 * Returns the current category when still valid; otherwise "NONE".
 * Call when response type changes so tutors never keep an invalid pair.
 */
export function resolveInsightCategoryForResponseType(
  responseType: ResponseType,
  insightCategory: InsightCategory
): InsightCategory {
  if (isInsightCategoryAllowed(responseType, insightCategory)) {
    return insightCategory;
  }
  return "NONE";
}
