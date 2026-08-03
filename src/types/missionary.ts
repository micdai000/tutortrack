/** Summary fields used in lists and companionship cards. */
export type Missionary = {
  id: string;
  companionship_id: string;
  display_name: string;
  created_at: string;
};

/**
 * Full missionary profile used by the Missionary Profile page.
 * follow_up_date powers Today's Follow-Ups on the dashboard when it equals today.
 * follow_up_notes stores why the tutor scheduled that follow-up.
 */
export type MissionaryProfile = {
  id: string;
  companionship_id: string;
  display_name: string;
  short_term_goal: string | null;
  current_study_plan: string | null;
  tutor_notes: string | null;
  long_term_goal: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  last_updated_at: string;
  created_at: string;
};

/** Editable fields persisted by auto-save. */
export type MissionaryProfileDraft = {
  display_name: string;
  short_term_goal: string;
  current_study_plan: string;
  tutor_notes: string;
  long_term_goal: string;
  follow_up_date: string;
  follow_up_notes: string;
};

export type MissionarySaveStatus =
  | "idle"
  | "typing"
  | "saving"
  | "saved"
  | "error";
