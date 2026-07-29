import { Link } from "react-router-dom";
import { ArrowRight, UserRound } from "lucide-react";

import type { CompanionshipWithMissionaries } from "../../types/companionship";
import { formatCompanionshipLabel } from "../../utils/companionshipLabel";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";

type CompanionshipCardProps = {
  companionship: CompanionshipWithMissionaries;
};

export function companionshipLabel(
  companionship: CompanionshipWithMissionaries
): string {
  return formatCompanionshipLabel(
    companionship.missionaries.map((missionary) => missionary.display_name)
  );
}

/** Interactive companionship card linking to the companionship workspace. */
export function CompanionshipCard({ companionship }: CompanionshipCardProps) {
  const missionaryCount = companionship.missionaries.length;

  return (
    <Card as="article" interactive flush className="district-companionship-card">
      <Link
        to={`/companionships/${companionship.id}`}
        className="district-companionship-card__link"
      >
        <div className="district-companionship-card__body">
          <h3 className="district-companionship-card__title">
            {companionshipLabel(companionship)}
          </h3>

          <ul className="district-companionship-card__meta">
            <li>
              <Icon icon={UserRound} size="sm" tone="muted" />
              <span>
                {missionaryCount}{" "}
                {missionaryCount === 1 ? "Missionary" : "Missionaries"}
              </span>
            </li>
          </ul>
        </div>

        <span className="district-companionship-card__cta">
          Open
          <Icon icon={ArrowRight} size="sm" tone="primary" />
        </span>
      </Link>
    </Card>
  );
}
