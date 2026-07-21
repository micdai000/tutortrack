export type TeacherShareType = "district" | "companionship";

/** Result of get-or-create: same token until revoked. */
export type TeacherShareLinkResult = {
  token: string;
  /** true when a new persistent share row was inserted. */
  created: boolean;
};

/** Missionary fields returned by the public share RPC (no database ids). */
export type SharedTeacherViewMissionary = {
  display_name: string;
  long_term_goal: string | null;
  short_term_goal: string | null;
  current_study_plan: string | null;
};

export type SharedTeacherViewCompanionship = {
  title: string;
  memberNames: string[];
  missionaries: SharedTeacherViewMissionary[];
};

export type SharedTeacherViewPayload = {
  share_type: TeacherShareType;
  context: {
    documentTitle: string;
    districtName: string;
    scopeLabel?: string;
  };
  missionaries?: SharedTeacherViewMissionary[];
  companionships?: SharedTeacherViewCompanionship[];
};
