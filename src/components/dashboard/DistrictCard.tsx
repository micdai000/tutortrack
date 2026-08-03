import { Link } from "react-router-dom";
import { ArrowRight, UserRound, Users } from "lucide-react";

import type { DistrictSummary } from "../../types/dashboardOverview";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";

type DistrictCardProps = {
  district: DistrictSummary;
};

/** Interactive district summary card linking to the district detail page. */
export function DistrictCard({ district }: DistrictCardProps) {
  return (
    <Card as="article" interactive flush className="dashboard-district-card">
      <Link
        to={`/districts/${district.id}`}
        className="dashboard-district-card__link"
      >
        <div className="dashboard-district-card__body">
          <h3 className="dashboard-district-card__title">{district.name}</h3>

          <ul className="dashboard-district-card__meta">
            <li>
              <Icon icon={Users} size="sm" tone="muted" />
              <span>
                {district.companionshipCount}{" "}
                {district.companionshipCount === 1
                  ? "companionship"
                  : "companionships"}
              </span>
            </li>
            <li>
              <Icon icon={UserRound} size="sm" tone="muted" />
              <span>
                {district.missionaryCount}{" "}
                {district.missionaryCount === 1 ? "missionary" : "missionaries"}
              </span>
            </li>
          </ul>
        </div>

        <span className="dashboard-district-card__cta">
          Open district
          <Icon icon={ArrowRight} size="sm" tone="primary" />
        </span>
      </Link>
    </Card>
  );
}
