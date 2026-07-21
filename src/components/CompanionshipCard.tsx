import { Link } from "react-router-dom";

import type { CompanionshipWithMissionaries } from "../types/companionship";

type CompanionshipCardProps = {
  companionship: CompanionshipWithMissionaries;
};

function companionshipLabel(
  companionship: CompanionshipWithMissionaries
): string {
  const names = companionship.missionaries
    .map((missionary) => missionary.display_name.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return "Companionship";
  }

  return names.join(" · ");
}

export function CompanionshipCard({ companionship }: CompanionshipCardProps) {
  return (
    <Link
      to={`/companionships/${companionship.id}`}
      className="companionship-card companionship-card--link"
    >
      <h3 className="companionship-card-title">
        {companionshipLabel(companionship)}
      </h3>
      <p className="companionship-card-action">Open companionship →</p>
    </Link>
  );
}
