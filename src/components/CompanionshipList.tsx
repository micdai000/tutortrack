import type { CompanionshipWithMissionaries } from "../types/companionship";

import { CompanionshipCard } from "./CompanionshipCard";

type CompanionshipListProps = {
  companionships: CompanionshipWithMissionaries[];
};

export function CompanionshipList({ companionships }: CompanionshipListProps) {
  if (companionships.length === 0) {
    return (
      <p className="district-detail-empty">
        No companionships yet. Use <strong>Add companionship</strong> above to
        create one.
      </p>
    );
  }

  return (
    <div className="companionship-list">
      {companionships.map((companionship) => (
        <CompanionshipCard
          key={companionship.id}
          companionship={companionship}
        />
      ))}
    </div>
  );
}
