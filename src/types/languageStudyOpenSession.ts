/** Status for a district-day Language Study Session opened by the tutor. */
export type OpenSessionStatus = "open" | "closed";

/** One OPEN Language Study Session for a district on a calendar day. */
export type LanguageStudyOpenSession = {
  id: string;
  district_id: string;
  session_date: string;
  status: OpenSessionStatus;
  google_form_url: string | null;
  opened_at: string;
  opened_by: string;
  created_at: string;
  updated_at: string;
};

export type BeginTodaysRenderResult = {
  status: "begun" | "already_begun";
  sessionDate: string;
  googleFormUrl: string;
  districtCount: number;
  createdCount: number;
  sessions: LanguageStudyOpenSession[];
};
