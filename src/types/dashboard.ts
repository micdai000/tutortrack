import type { InsightCategory } from "./renderAccount";

/**
 * Insight categories that can drive dashboard follow-ups.
 * Includes answer-based categories plus missed-submission consistency.
 */
export type FollowUpInsightCategory =
  | Exclude<InsightCategory, "NONE">
  | "SUBMISSION_CONSISTENCY";

/** Human-readable labels for dashboard follow-up categories. */
export const FOLLOW_UP_CATEGORY_LABELS: Record<
  FollowUpInsightCategory,
  string
> = {
  TASK_COMPLETION: "Task Completion",
  STUDY_EFFECTIVENESS: "Study Effectiveness",
  CONFIDENCE: "Confidence",
  PLANNING: "Planning",
  SUBMISSION_CONSISTENCY: "Missed Render an Account",
};

/**
 * One red insight follow-up for the dashboard daily action center.
 * Built from missionary_insight_records (status = red only).
 */
export type DashboardFollowUp = {
  id: string;
  missionaryId: string;
  missionaryName: string;
  districtId: string;
  insightCategory: FollowUpInsightCategory;
  reason: string;
  /**
   * Local YYYY-MM-DD for Language Study Sessions deep-link.
   * For missed submissions, this is the latest missed opened day.
   * Otherwise the missionary's most recent completed session day.
   */
  latestSessionDateKey: string | null;
};

/**
 * One manually scheduled follow-up due today.
 * Powered by missionaries.follow_up_date (not Render an Account insights).
 */
export type ScheduledFollowUp = {
  id: string;
  missionaryId: string;
  missionaryName: string;
  districtId: string;
  districtName: string;
  companionshipId: string;
  /** Companionship members shown as a short label, when available. */
  companionshipLabel: string | null;
  followUpDate: string;
  followUpNotes: string | null;
};

/** @deprecated Prefer ScheduledFollowUp or DashboardFollowUp. */
export type FollowUpItem = {
  id: string;
  missionaryName: string;
  districtName: string;
  followUpLabel: string;
};
