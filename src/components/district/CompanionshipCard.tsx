import { Link } from "react-router-dom";
import { ArrowRight, Calendar, UserRound } from "lucide-react";

import type { CompanionshipWithMissionaries } from "../../types/companionship";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";

type CompanionshipCardProps = {
  companionship: CompanionshipWithMissionaries;
};

export function companionshipLabel(
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

function formatCompanionshipDate(isoDate: string): string | null {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const dayMs = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / dayMs
  );

  if (dayDiff === 0) return "Created today";
  if (dayDiff === 1) return "Created yesterday";
  if (dayDiff > 1 && dayDiff < 7) return `Created ${dayDiff} days ago`;

  return `Created ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
}

/** Interactive companionship card linking to the companionship workspace. */
export function CompanionshipCard({ companionship }: CompanionshipCardProps) {
  const missionaryCount = companionship.missionaries.length;
  const createdLabel = formatCompanionshipDate(companionship.created_at);

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
            {createdLabel && (
              <li>
                <Icon icon={Calendar} size="sm" tone="muted" />
                <span>{createdLabel}</span>
              </li>
            )}
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
