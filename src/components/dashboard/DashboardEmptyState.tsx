import { Check } from "lucide-react";

import { Icon } from "../ui";

type DashboardEmptyStateProps = {
  title: string;
  description?: string;
};

/** Shared empty state for dashboard action cards. */
export function DashboardEmptyState({
  title,
  description,
}: DashboardEmptyStateProps) {
  return (
    <div className="dashboard-followups__empty">
      <span className="dashboard-followups__check" aria-hidden="true">
        <Icon icon={Check} size="sm" tone="primary" />
      </span>
      <div className="dashboard-followups__empty-copy">
        <p className="dashboard-followups__empty-title">{title}</p>
        {description ? (
          <p className="dashboard-followups__empty-description">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
