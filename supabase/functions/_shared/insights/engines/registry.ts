import { evaluateBinaryCategory } from "./binaryCategory.ts";
import { evaluateRatingCategory } from "./ratingCategory.ts";
import { buildCategorySignals } from "../parseAnswers.ts";
import type {
  CategoryEngine,
  CategoryEvaluation,
  InsightSession,
} from "../types.ts";

/**
 * Registry of independent category engines.
 * Add future categories here without rewriting the orchestrator.
 */
export const CATEGORY_ENGINES: CategoryEngine[] = [
  {
    category: "TASK_COMPLETION",
    label: "Task Completion",
    evaluate: (signals) =>
      evaluateBinaryCategory(
        "TASK_COMPLETION",
        "Task Completion",
        "incomplete work",
        signals
      ),
  },
  {
    category: "STUDY_EFFECTIVENESS",
    label: "Study Effectiveness",
    evaluate: (signals) =>
      evaluateRatingCategory("STUDY_EFFECTIVENESS", "Study Effectiveness", signals),
  },
  {
    category: "CONFIDENCE",
    label: "Confidence",
    evaluate: (signals) =>
      evaluateRatingCategory("CONFIDENCE", "Confidence", signals),
  },
  {
    category: "PLANNING",
    label: "Planning",
    evaluate: (signals) =>
      evaluateBinaryCategory(
        "PLANNING",
        "Planning",
        "no intentional practice plan",
        signals
      ),
  },
];

const ENGINE_KIND: Record<
  CategoryEngine["category"],
  "binary" | "rating"
> = {
  TASK_COMPLETION: "binary",
  PLANNING: "binary",
  STUDY_EFFECTIVENESS: "rating",
  CONFIDENCE: "rating",
};

/** Run every registered category engine against the lookback sessions. */
export function evaluateAllCategories(
  sessionsChronological: InsightSession[]
): CategoryEvaluation[] {
  return CATEGORY_ENGINES.map((engine) => {
    const signals = buildCategorySignals(
      sessionsChronological,
      engine.category,
      ENGINE_KIND[engine.category]
    );
    return engine.evaluate(signals);
  });
}
