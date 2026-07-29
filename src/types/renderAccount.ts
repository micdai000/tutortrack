/** Fixed insight categories for future analytics. Optional for most questions. */
export type InsightCategory =
  | "NONE"
  | "TASK_COMPLETION"
  | "STUDY_EFFECTIVENESS"
  | "CONFIDENCE"
  | "PLANNING";

/** Fixed response types for Render an Account questions. */
export type ResponseType =
  | "YES_NO"
  | "RATING_1_TO_10"
  | "SHORT_TEXT"
  | "PARAGRAPH";

/** Google Form mirror status for a published Render an Account. */
export type RenderSyncStatus = "up_to_date" | "changes_pending";

/** One Render an Account per tutor. */
export type RenderAccount = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  google_form_id: string | null;
  google_form_url: string | null;
  google_sheet_id: string | null;
  google_sheet_url: string | null;
  published_at: string | null;
  last_publish_at: string | null;
  last_synced_at: string | null;
  sync_status: RenderSyncStatus;
  needs_sync: boolean;
  /** Google Forms item ID for the managed Who are you? dropdown. */
  who_are_you_google_question_id: string | null;
};

/** A question belonging to a Render an Account. */
export type RenderQuestion = {
  id: string;
  render_account_id: string;
  display_order: number;
  question_text: string;
  /** Optional instructions shown under the question (Google Forms description). */
  helper_text: string | null;
  response_type: ResponseType;
  insight_category: InsightCategory;
  required: boolean;
  /** Legacy choice labels (unused; kept for schema compatibility). */
  options: string[];
  /** Google Forms item ID for sync (null until published/synced). */
  google_question_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Fields accepted when creating a question. */
export type RenderQuestionInput = {
  question_text: string;
  helper_text?: string;
  response_type: ResponseType;
  insight_category?: InsightCategory;
  required?: boolean;
  options?: string[];
};

/** Fields accepted when updating a question. */
export type RenderQuestionUpdate = {
  question_text?: string;
  helper_text?: string;
  response_type?: ResponseType;
  insight_category?: InsightCategory;
  required?: boolean;
  options?: string[];
};

/** Human-readable labels for response type dropdowns. */
export const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  YES_NO: "Yes / No",
  RATING_1_TO_10: "Rating (1–10)",
  SHORT_TEXT: "Short text",
  PARAGRAPH: "Paragraph",
};

/** Human-readable labels for insight category dropdowns. Never show enum keys. */
export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  NONE: "None",
  TASK_COMPLETION: "Task Completion",
  STUDY_EFFECTIVENESS: "Study Effectiveness",
  CONFIDENCE: "Confidence",
  PLANNING: "Planning",
};

export const RESPONSE_TYPE_OPTIONS = Object.keys(
  RESPONSE_TYPE_LABELS
) as ResponseType[];

export const INSIGHT_CATEGORY_OPTIONS = Object.keys(
  INSIGHT_CATEGORY_LABELS
) as InsightCategory[];

/** Editable draft values for a question card. */
export type RenderQuestionDraft = {
  question_text: string;
  helper_text: string;
  response_type: ResponseType;
  insight_category: InsightCategory;
  required: boolean;
  options: string[];
};
