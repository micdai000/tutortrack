import { Plus } from "lucide-react";

import type { CompanionshipWithMissionaries } from "../../types/companionship";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { CompanionshipCard } from "./CompanionshipCard";

type CompanionshipGridProps = {
  companionships: CompanionshipWithMissionaries[];
  emptyQuery?: boolean;
  query?: string;
  onAddCompanionship?: () => void;
  showEmptyAddAction?: boolean;
};

/** Responsive companionship cards with polished empty states. */
export function CompanionshipGrid({
  companionships,
  emptyQuery = false,
  query = "",
  onAddCompanionship,
  showEmptyAddAction = true,
}: CompanionshipGridProps) {
  if (companionships.length === 0 && emptyQuery) {
    return (
      <p className="district-status">
        No companionships match &ldquo;{query}&rdquo;.
      </p>
    );
  }

  if (companionships.length === 0) {
    return (
      <div className="district-empty">
        <p className="district-empty__title">No companionships yet.</p>
        <p className="district-empty__copy">
          Create your first companionship to begin tracking language plans.
        </p>
        {showEmptyAddAction && onAddCompanionship && (
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
      </div>
    );
  }

  return (
    <div className="district-companionship-grid">
      {companionships.map((companionship) => (
        <CompanionshipCard
          key={companionship.id}
          companionship={companionship}
        />
      ))}
    </div>
  );
}
