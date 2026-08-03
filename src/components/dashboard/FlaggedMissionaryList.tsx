import { useNavigate } from "react-router-dom";

import type { DashboardFollowUp } from "../../types/dashboard";
import { FOLLOW_UP_CATEGORY_LABELS } from "../../types/dashboard";
import { buildLanguageStudySessionHref } from "../../services/dashboardFollowUpService";
import { DashboardEmptyState } from "./DashboardEmptyState";

type FlaggedMissionaryListProps = {
  followUps: DashboardFollowUp[];
  loading: boolean;
  error: string | null;
  loadingLabel?: string;
  emptyTitle: string;
  emptyDescription?: string;
};

/** List body for automatically flagged missionaries (Missionaries in Need). */
export function FlaggedMissionaryList({
  followUps,
  loading,
  error,
  loadingLabel = "Loading...",
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
      <DashboardEmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <ul className="dashboard-followups__list">
      {followUps.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className="dashboard-followups__item dashboard-followups__item--need"
            aria-label={`Review ${item.missionaryName}: ${FOLLOW_UP_CATEGORY_LABELS[item.insightCategory]}`}
            onClick={() => void navigate(buildLanguageStudySessionHref(item))}
          >
            <p className="dashboard-followups__item-title">
              {item.missionaryName}
            </p>
            <p className="dashboard-followups__item-category">
              {FOLLOW_UP_CATEGORY_LABELS[item.insightCategory]}
            </p>
            <p className="dashboard-followups__item-reason">{item.reason}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}
