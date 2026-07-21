import type { MissionaryProfile } from "./missionary";

/** Fields classroom teachers need — no tutor-only internals. */
export type TeacherViewMissionary = Pick<
  MissionaryProfile,
  | "id"
  | "display_name"
  | "long_term_goal"
  | "short_term_goal"
  | "current_study_plan"
>;

/**
 * Shared header context for Teacher Views.
 * Companionship and District views both supply this shape.
 */
export type TeacherViewContext = {
  documentTitle: string;
  districtName: string;
  /** e.g. "Companionship". Omit when sections provide hierarchy. */
  scopeLabel?: string;
};

/** One companionship block inside a district Teacher View. */
export type TeacherViewCompanionshipSection = {
  id: string;
  title: string;
  memberNames: string[];
  missionaries: TeacherViewMissionary[];
};

export type TeacherViewData = {
  context: TeacherViewContext;
  /**
   * Flat missionary list for companionship Teacher View.
   * Ignored when `companionships` is present.
   */
  missionaries: TeacherViewMissionary[];
  /** Grouped companionship sections for district Teacher View. */
  companionships?: TeacherViewCompanionshipSection[];
  /** Used for tutor back-navigation; not shown as document content. */
  backToPath: string;
  /** Accessible back-link label, e.g. "← Back to district". */
  backLabel: string;
};
