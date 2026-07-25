import { Plus } from "lucide-react";

import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

type DistrictActionBarProps = {
  onAddCompanionship: () => void;
  showAddCompanionship?: boolean;
};

/** Primary district actions under the page header. */
export function DistrictActionBar({
  onAddCompanionship,
  showAddCompanionship = true,
}: DistrictActionBarProps) {
  if (!showAddCompanionship) {
    return null;
  }

  return (
    <div className="district-action-bar">
      <div className="district-action-bar__buttons">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onAddCompanionship}
        >
          <Icon icon={Plus} size="sm" />
          Add Companionship
        </Button>
      </div>
    </div>
  );
}
