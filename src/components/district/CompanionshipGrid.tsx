import { Plus, Search, Users } from "lucide-react";

import type { CompanionshipWithMissionaries } from "../../types/companionship";
import { EmptyState } from "../layout/EmptyState";
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
      <EmptyState
        icon={Search}
        title="No matching companionships"
        description={`No companionships match “${query}”.`}
      />
    );
  }

  if (companionships.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No companionships yet"
        description="Create your first companionship to begin tracking language plans."
        action={
          showEmptyAddAction && onAddCompanionship ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onAddCompanionship}
            >
              <Icon icon={Plus} size="sm" />
              Add Companionship
            </Button>
          ) : undefined
        }
      />
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
