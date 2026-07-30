import type {
  CategoryEvaluation,
  FollowUpRecommendation,
  MeasurableInsightCategory,
} from "./types.ts";

const CATEGORY_LABELS: Record<MeasurableInsightCategory, string> = {
  TASK_COMPLETION: "Task Completion",
  STUDY_EFFECTIVENESS: "Study Effectiveness",
  CONFIDENCE: "Confidence",
  PLANNING: "Planning",
};

function formatCategoryList(categories: MeasurableInsightCategory[]): string {
  const labels = categories.map((category) => CATEGORY_LABELS[category]);
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/**
 * Build an explainable follow-up recommendation from category statuses.
 * Prefers agreement across categories; isolated signals stay mild.
 * Strength is stored so future weighting can evolve without redesign.
 */
export function buildFollowUpRecommendation(
  evaluations: CategoryEvaluation[],
  lookbackSessionIds: string[]
): FollowUpRecommendation {
  const redCategories = evaluations
    .filter((evaluation) => evaluation.status === "red")
    .map((evaluation) => evaluation.category);

  const yellowCategories = evaluations
    .filter((evaluation) => evaluation.status === "yellow")
    .map((evaluation) => evaluation.category);

  if (redCategories.length >= 2) {
    return {
      isRecommended: true,
      strength: "strong",
      responsibleCategories: [...redCategories, ...yellowCategories],
      supportingSessionIds: lookbackSessionIds,
      reason: `Follow-up recommended because ${formatCategoryList(redCategories)} show sustained concern across recent completed Language Study Sessions.`,
    };
  }

  if (redCategories.length === 1 && yellowCategories.length >= 1) {
    return {
      isRecommended: true,
      strength: "moderate",
      responsibleCategories: [...redCategories, ...yellowCategories],
      supportingSessionIds: lookbackSessionIds,
      reason: `Follow-up recommended because ${formatCategoryList(redCategories)} shows sustained concern, and ${formatCategoryList(yellowCategories)} also indicate emerging concern.`,
    };
  }

  if (redCategories.length === 1) {
    return {
      isRecommended: true,
      strength: "mild",
      responsibleCategories: redCategories,
      supportingSessionIds: lookbackSessionIds,
      reason: `Follow-up may be helpful: ${formatCategoryList(redCategories)} shows a sustained concern. Other insight categories do not currently agree.`,
    };
  }

  if (yellowCategories.length >= 2) {
    return {
      isRecommended: true,
      strength: "mild",
      responsibleCategories: yellowCategories,
      supportingSessionIds: lookbackSessionIds,
      reason: `Follow-up may be helpful: ${formatCategoryList(yellowCategories)} indicate emerging concern across recent completed Language Study Sessions.`,
    };
  }

  if (yellowCategories.length === 1) {
    return {
      isRecommended: false,
      strength: "none",
      responsibleCategories: yellowCategories,
      supportingSessionIds: lookbackSessionIds,
      reason: `No follow-up recommendation yet. ${formatCategoryList(yellowCategories)} shows an emerging signal, but it is not supported by other insight categories.`,
    };
  }

  return {
    isRecommended: false,
    strength: "none",
    responsibleCategories: [],
    supportingSessionIds: lookbackSessionIds,
    reason:
      "No follow-up recommendation based on recent completed Language Study Sessions.",
  };
}
