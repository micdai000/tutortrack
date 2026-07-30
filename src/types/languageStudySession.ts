import type { Missionary } from "./missionary";

/** One answer snapshot from a Language Study Session. */
export type LanguageStudyAnswer = {
  id: string;
  submission_id: string;
  render_question_id: string | null;
  google_question_id: string | null;
  question_text: string;
  response_type: string | null;
  insight_category: string | null;
  response_value: string | null;
  created_at: string;
};

/** One Google Form submission treated as a Language Study Session. */
export type LanguageStudySession = {
  id: string;
  render_account_id: string;
  missionary_id: string | null;
  who_are_you_label: string | null;
  match_status: "matched" | "unmatched";
  submitted_at: string | null;
  created_at: string;
  answers: LanguageStudyAnswer[];
};

/** Missionary row on the Language Study Sessions page for one district/day. */
export type LanguageStudyMissionaryRow = {
  missionary: Missionary;
  session: LanguageStudySession | null;
};

/** Aggregated day view for the selected district + date. */
export type LanguageStudyDayView = {
  dateKey: string;
  missionaries: LanguageStudyMissionaryRow[];
  submittedCount: number;
  missingCount: number;
  totalCount: number;
};
