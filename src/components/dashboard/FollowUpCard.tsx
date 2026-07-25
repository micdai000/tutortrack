import { CalendarClock, Check } from "lucide-react";

import type { FollowUpItem } from "../../types/dashboard";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";

type FollowUpCardProps = {
  followUps: FollowUpItem[];
};

/** Today’s follow-ups card with a polished empty state. */
export function FollowUpCard({ followUps }: FollowUpCardProps) {
  return (
    <Card as="section" className="dashboard-followups">
      <div className="dashboard-section-header dashboard-section-header--flush">
        <h2>Today&apos;s follow-ups</h2>
        <Icon icon={CalendarClock} size="sm" tone="muted" />
      </div>

      {followUps.length === 0 ? (
        <div className="dashboard-followups__empty">
          <span className="dashboard-followups__check" aria-hidden="true">
            <Icon icon={Check} size="sm" tone="primary" />
          </span>
          <div className="dashboard-followups__empty-copy">
            <p className="dashboard-followups__empty-title">
              You&apos;re all caught up.
            </p>
            <p className="dashboard-followups__empty-description">
              No follow-ups scheduled today.
            </p>
          </div>
        </div>
      ) : (
        <ul className="dashboard-followups__list">
          {followUps.map((item) => (
            <li key={item.id} className="dashboard-followups__item">
              <p className="dashboard-followups__item-title">
                {item.missionaryName}
              </p>
              <p className="dashboard-followups__item-meta">
                District {item.districtName}
              </p>
              <p className="dashboard-followups__item-meta">
                Follow-up: {item.followUpLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
