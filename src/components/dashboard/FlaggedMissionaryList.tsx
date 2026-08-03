import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

import type { DashboardFollowUp } from "../../types/dashboard";
import { FOLLOW_UP_CATEGORY_LABELS } from "../../types/dashboard";
import { buildLanguageStudySessionHref } from "../../services/dashboardFollowUpService";
import { Icon } from "../ui";

type FlaggedMissionaryListProps = {
  followUps: DashboardFollowUp[];
  loading: boolean;
  error: string | null;
  loadingLabel?: string;
  emptyTitle: string;
  emptyDescription?: string;
};

/**
 * Shared list body for automatically flagged missionaries.
 * Used by Missionaries in Need and Today's Follow-Ups.
 */
export function FlaggedMissionaryList({
  followUps,
  loading,
  error,
  loadingLabel = "Loading follow-ups...",
  emptyTitle,
  emptyDescription,
}: FlaggedMissionaryListProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <p className="dashboard-status" role="status">
        {loadingLabel}
      </p>
    );
  }

  if (error) {
    return (
      <p className="dashboard-error" role="alert">
        {error}
      </p>
    );
  }

  if (followUps.length === 0) {
    return (
      <div className="dashboard-followups__empty">
        <span className="dashboard-followups__check" aria-hidden="true">
          <Icon icon={Check} size="sm" tone="primary" />
        </span>
        <div className="dashboard-followups__empty-copy">
          <p className="dashboard-followups__empty-title">{emptyTitle}</p>
          {emptyDescription ? (
            <p className="dashboard-followups__empty-description">
              {emptyDescription}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <ul className="dashboard-followups__list">
      {followUps.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className="dashboard-followups__item"
            onClick={() => void navigate(buildLanguageStudySessionHref(item))}
          >
            <p className="dashboard-followups__item-title">
              {item.missionaryName}
            </p>
            <p className="dashboard-followups__item-category">
              {FOLLOW_UP_CATEGORY_LABELS[item.insightCategory]}
            </p>
            <p className="dashboard-followups__item-reason-label">Reason</p>
            <p className="dashboard-followups__item-reason">{item.reason}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}
