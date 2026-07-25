import { Link } from "react-router-dom";
import { Link2, Plus, Presentation } from "lucide-react";

import type { TeacherShareType } from "../../types/teacherShare";
import { useCopyShareLink } from "../../hooks/useCopyShareLink";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { cx } from "../ui/cx";

type DistrictActionBarProps = {
  teacherViewTo: string;
  shareType: TeacherShareType;
  resourceId: string | undefined;
  onAddCompanionship: () => void;
  showAddCompanionship?: boolean;
};

/** Primary and secondary actions for the district workspace. */
export function DistrictActionBar({
  teacherViewTo,
  shareType,
  resourceId,
  onAddCompanionship,
  showAddCompanionship = true,
}: DistrictActionBarProps) {
  const { copying, status, error, copyShareLink } = useCopyShareLink(
    shareType,
    resourceId
  );

  return (
    <div className="district-action-bar">
      <div className="district-action-bar__buttons">
        {showAddCompanionship && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onAddCompanionship}
          >
            <Icon icon={Plus} size="sm" />
            Add Companionship
          </Button>
        )}

        <Link
          to={teacherViewTo}
          className={cx(
            "tt-button",
            "tt-button--secondary",
            "tt-button--sm",
            "district-action-bar__emphasis"
          )}
        >
          <Icon icon={Presentation} size="sm" />
          Open Teacher View
        </Link>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="district-action-bar__emphasis"
          onClick={() => {
            void copyShareLink();
          }}
          disabled={copying || !resourceId}
        >
          <Icon icon={Link2} size="sm" />
          {copying ? "Preparing link..." : "Copy Share Link"}
        </Button>
      </div>

      {status && (
        <p className="district-action-bar__status" role="status">
          {status}
        </p>
      )}

      {error && (
        <p className="district-action-bar__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
