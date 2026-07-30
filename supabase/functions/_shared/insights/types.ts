/** Measurable insight categories (excludes informational NONE). */
export type MeasurableInsightCategory =
  | "TASK_COMPLETION"
  | "STUDY_EFFECTIVENESS"
  | "CONFIDENCE"
  | "PLANNING";

export type InsightStatus = "green" | "yellow" | "red";

export type RecommendationStrength = "none" | "mild" | "moderate" | "strong";

/** One completed Language Study Session in the lookback window. */
export type InsightSession = {
  submissionId: string;
  submittedAt: string;
  answers: InsightAnswer[];
};

export type InsightAnswer = {
  insightCategory: string | null;
  responseType: string | null;
  responseValue: string | null;
};

/** Per-session signal for a single category engine. */
export type CategorySessionSignal = {
  submissionId: string;
  submittedAt: string;
  /** Rating categories: session aggregate score (1–10). */
  score?: number;
  /** Yes/No categories: true = Yes (completed / planned). */
  affirmative?: boolean;
};

export type CategoryEvaluation = {
  category: MeasurableInsightCategory;
  status: InsightStatus;
  reason: string;
  supportingSessionIds: string[];
};

export type FollowUpRecommendation = {
  isRecommended: boolean;
  reason: string | null;
  responsibleCategories: MeasurableInsightCategory[];
  strength: RecommendationStrength;
  supportingSessionIds: string[];
};

export type MissionaryInsightsResult = {
  missionaryId: string;
  categoryEvaluations: CategoryEvaluation[];
  followUp: FollowUpRecommendation;
  lookbackSessionIds: string[];
  evaluatedAt: string;
};

export type CategoryEngine = {
  category: MeasurableInsightCategory;
  label: string;
  evaluate: (signals: CategorySessionSignal[]) => CategoryEvaluation;
};
