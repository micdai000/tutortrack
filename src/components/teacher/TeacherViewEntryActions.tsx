import { Link } from "react-router-dom";

import type { TeacherShareType } from "../../types/teacherShare";
import "../../styles/share-link.css";

import { CopyShareLinkButton } from "./CopyShareLinkButton";

type TeacherViewEntryActionsProps = {
  openTo: string;
  shareType: TeacherShareType;
  resourceId: string | undefined;
  openLabel?: string;
};

/**
 * Open Teacher View + Copy Share Link at the natural share entry point.
 */
export function TeacherViewEntryActions({
  openTo,
  shareType,
  resourceId,
  openLabel = "Open Teacher View",
}: TeacherViewEntryActionsProps) {
  return (
    <div className="teacher-view-entry-actions">
      <div className="teacher-view-entry-action-row">
        <Link to={openTo} className="teacher-view-entry-open-button">
          {openLabel}
        </Link>
        <CopyShareLinkButton
          shareType={shareType}
          resourceId={resourceId}
          layout="inline"
        />
      </div>
    </div>
  );
}
