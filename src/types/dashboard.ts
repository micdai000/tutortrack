import type { InsightCategory } from "./renderAccount";

/** Measurable insight categories that can drive follow-ups. */
export type FollowUpInsightCategory = Exclude<InsightCategory, "NONE">;

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
  /** Local YYYY-MM-DD of the missionary's most recent completed session. */
  latestSessionDateKey: string | null;
};

/** @deprecated Prefer DashboardFollowUp for Stage 3D. */
export type FollowUpItem = {
  id: string;
  missionaryName: string;
  districtName: string;
  followUpLabel: string;
};
