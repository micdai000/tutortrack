import type {
  InsightCategory,
  ResponseType,
} from "../types/renderAccount";
import { isInsightCategoryAllowed } from "./renderAccountInsightRules";

/** Publish readiness for a Render an Account. */
export type RenderPublishStatus = "Draft" | "Ready to Publish";

/** Field-level validation messages for one question. */
export type RenderQuestionFieldErrors = {
  question_text?: string;
  response_type?: string;
  insight_category?: string;
  options?: string;
};

/**
 * Minimal question shape for validation.
 * Used by the editor and future Google Forms sync.
 */
export type ValidatableRenderQuestion = {
  id?: string;
  question_text: string;
  response_type: ResponseType | "" | null | undefined;
  insight_category?: InsightCategory | "" | null;
  /** Choice options; required when response_type is MULTIPLE_CHOICE or CHECKBOXES. */
  options?: string[] | null;
};

export type RenderAccountValidationSummary = {
  totalQuestions: number;
  questionsWithErrors: number;
  publishStatus: RenderPublishStatus;
  /** True when the account can be synced to Google Forms. */
  isPublishable: boolean;
  /** Field errors keyed by question id. */
  questionErrors: Record<string, RenderQuestionFieldErrors>;
};

const RESPONSE_TYPES_REQUIRING_OPTIONS: ReadonlySet<ResponseType> = new Set([
  "MULTIPLE_CHOICE",
  "CHECKBOXES",
]);

const VALID_RESPONSE_TYPES: ReadonlySet<ResponseType> = new Set([
  "YES_NO",
  "RATING_1_TO_10",
  "SHORT_TEXT",
  "PARAGRAPH",
  "MULTIPLE_CHOICE",
  "CHECKBOXES",
]);

const VALID_INSIGHT_CATEGORIES: ReadonlySet<InsightCategory> = new Set([
  "NONE",
  "TASK_COMPLETION",
  "STUDY_EFFECTIVENESS",
  "CONFIDENCE",
  "PLANNING",
]);

function hasAtLeastOneOption(options: string[] | null | undefined): boolean {
  if (!options || options.length === 0) {
    return false;
  }

  return options.some((option) => option.trim().length > 0);
}

/** Validate a single question. Returns only fields that failed. */
export function validateRenderQuestion(
  question: ValidatableRenderQuestion
): RenderQuestionFieldErrors {
  const errors: RenderQuestionFieldErrors = {};

  if (!question.question_text.trim()) {
    errors.question_text = "Question text cannot be empty.";
  }

  if (
    !question.response_type ||
    !VALID_RESPONSE_TYPES.has(question.response_type)
  ) {
    errors.response_type = "Response type is required.";
  } else if (
    RESPONSE_TYPES_REQUIRING_OPTIONS.has(question.response_type) &&
    !hasAtLeastOneOption(question.options)
  ) {
    errors.options = "Add at least one option for this response type.";
  }

  const insightCategory = question.insight_category || "NONE";

  if (!VALID_INSIGHT_CATEGORIES.has(insightCategory)) {
    errors.insight_category = "Insight category is invalid.";
  } else if (
    question.response_type &&
    VALID_RESPONSE_TYPES.has(question.response_type) &&
    !isInsightCategoryAllowed(question.response_type, insightCategory)
  ) {
    // Safety net for sync; the editor prevents this via disabled options + auto-reset.
    errors.insight_category =
      "This Insight Category is not available for the selected response type.";
  }

  return errors;
}

/** True when a question has no validation errors. */
export function isRenderQuestionValid(
  question: ValidatableRenderQuestion
): boolean {
  return Object.keys(validateRenderQuestion(question)).length === 0;
}

/**
 * Summarize validation across all questions.
 * An account is publishable when it has at least one question and none have errors.
 */
export function validateRenderAccount(
  questions: ValidatableRenderQuestion[]
): RenderAccountValidationSummary {
  const questionErrors: Record<string, RenderQuestionFieldErrors> = {};
  let questionsWithErrors = 0;

  for (const question of questions) {
    const errors = validateRenderQuestion(question);
    const hasErrors = Object.keys(errors).length > 0;

    if (question.id) {
      questionErrors[question.id] = errors;
    }

    if (hasErrors) {
      questionsWithErrors += 1;
    }
  }

  const totalQuestions = questions.length;
  const isPublishable = totalQuestions > 0 && questionsWithErrors === 0;

  return {
    totalQuestions,
    questionsWithErrors,
    publishStatus: isPublishable ? "Ready to Publish" : "Draft",
    isPublishable,
    questionErrors,
  };
}

/**
 * Future Google Forms sync should call this (or use summary.isPublishable).
 * Returns true only when the Render an Account is ready to publish.
 */
export function isRenderAccountPublishable(
  questions: ValidatableRenderQuestion[]
): boolean {
  return validateRenderAccount(questions).isPublishable;
}
