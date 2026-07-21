import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { TeacherViewData } from "../../types/teacherView";

import { TeacherCompanionshipSection } from "./TeacherCompanionshipSection";
import { TeacherMissionaryList } from "./TeacherMissionaryList";
import { TeacherViewHeader } from "./TeacherViewHeader";

type TeacherViewDocumentProps = {
  teacherView: TeacherViewData;
  /** Optional actions (Copy Link, Print) for authenticated tutors. */
  toolbar?: ReactNode;
  /** Hide tutor back navigation on public share pages. */
  showBackLink?: boolean;
};

/**
 * Shared Teacher View document shell.
 * Companionship, District, and public share pages reuse this layout.
 */
export function TeacherViewDocument({
  teacherView,
  toolbar,
  showBackLink = true,
}: TeacherViewDocumentProps) {
  const companionships = teacherView.companionships;
  const isDistrictDocument = companionships !== undefined;
  const showChrome = showBackLink || Boolean(toolbar);

  return (
    <div className="teacher-view">
      {showChrome && (
        <div className="teacher-view-chrome teacher-view-no-print">
          {showBackLink ? (
            <div className="teacher-view-back">
              <Link to={teacherView.backToPath}>{teacherView.backLabel}</Link>
            </div>
          ) : (
            <div className="teacher-view-back" />
          )}

          {toolbar && <div className="teacher-view-toolbar">{toolbar}</div>}
        </div>
      )}

      <TeacherViewHeader context={teacherView.context} />

      {isDistrictDocument && companionships.length === 0 && (
        <p className="teacher-view-empty">
          No companionships in this district yet.
        </p>
      )}

      {isDistrictDocument &&
        companionships.map((section) => (
          <TeacherCompanionshipSection key={section.id} section={section} />
        ))}

      {!isDistrictDocument && (
        <TeacherMissionaryList missionaries={teacherView.missionaries} />
      )}
    </div>
  );
}


