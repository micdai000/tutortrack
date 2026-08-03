import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import type { DashboardFollowUp } from "../../types/dashboard";
import { FOLLOW_UP_CATEGORY_LABELS } from "../../types/dashboard";
import { buildLanguageStudySessionHref } from "../../services/dashboardFollowUpService";
import { Button, Icon } from "../ui";
import { ConfirmCheckInCompleteDialog } from "./ConfirmCheckInCompleteDialog";
import { DashboardEmptyState } from "./DashboardEmptyState";

type FlaggedMissionaryListProps = {
  followUps: DashboardFollowUp[];
  loading: boolean;
  error: string | null;
  loadingLabel?: string;
  emptyTitle: string;
  emptyDescription?: string;
  completionMessage?: string | null;
  completingInsightId?: string | null;
  onMarkCheckInComplete?: (followUp: DashboardFollowUp) => Promise<void>;
};

/** List body for automatically flagged missionaries (Missionaries in Need). */
export function FlaggedMissionaryList({
  followUps,
  loading,
  error,
  loadingLabel = "Loading...",
  emptyTitle,
  emptyDescription,
  completionMessage = null,
  completingInsightId = null,
  onMarkCheckInComplete,
}: FlaggedMissionaryListProps) {
  const navigate = useNavigate();
  const [pendingComplete, setPendingComplete] =
    useState<DashboardFollowUp | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completing =
    pendingComplete !== null && completingInsightId === pendingComplete.id;

  useEffect(() => {
    if (
      expandedId !== null &&
      !followUps.some((item) => item.id === expandedId)
    ) {
      setExpandedId(null);
    }
  }, [expandedId, followUps]);

  if (loading) {
    return (
      <p className="dashboard-status" role="status">
        {loadingLabel}
      </p>
    );
  }

  return (
    <>
      {completionMessage && (
        <p className="dashboard-followups__toast" role="status">
          {completionMessage}
        </p>
      )}

      {error && !pendingComplete && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}

      {!error && followUps.length === 0 ? (
        <DashboardEmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}

      {followUps.length > 0 && (
        <ul className="dashboard-followups__list">
          {followUps.map((item) => {
            const isExpanded = expandedId === item.id;
            const panelId = `dashboard-need-panel-${item.id}`;
            const categoryLabel =
              FOLLOW_UP_CATEGORY_LABELS[item.insightCategory];
            const itemClassName = [
              "dashboard-followups__item",
              "dashboard-followups__item--need",
              "dashboard-followups__item--collapsible",
              isExpanded
                ? "dashboard-followups__item--expanded"
                : "dashboard-followups__item--collapsed",
            ].join(" ");

            return (
              <li key={item.id}>
                <div className={itemClassName}>
                  <button
                    type="button"
                    className="dashboard-followups__item-toggle"
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() =>
                      setExpandedId((current) =>
                        current === item.id ? null : item.id
                      )
                    }
                  >
                    <div className="dashboard-followups__item-heading">
                      <div className="dashboard-followups__item-identity">
                        <p className="dashboard-followups__item-title">
                          {item.missionaryName}
                        </p>
                        <p className="dashboard-followups__item-category">
                          {categoryLabel}
                        </p>
                      </div>
                      <span
                        className={[
                          "dashboard-followups__item-chevron",
                          isExpanded
                            ? "dashboard-followups__item-chevron--open"
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                      >
                        <Icon icon={ChevronDown} size="sm" tone="muted" />
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div
                      id={panelId}
                      className="dashboard-followups__item-details"
                    >
                      <p className="dashboard-followups__item-reason">
                        {item.reason}
                      </p>

                      <div className="dashboard-followups__item-actions">
                        {onMarkCheckInComplete && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={completingInsightId !== null}
                            aria-label={`Mark check-in complete for ${item.missionaryName}`}
                            onClick={() => {
                              setConfirmError(null);
                              setPendingComplete(item);
                            }}
                          >
                            Check in Complete
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Review ${item.missionaryName}: ${categoryLabel}`}
                          onClick={() =>
                            void navigate(buildLanguageStudySessionHref(item))
                          }
                        >
                          Review sessions
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pendingComplete && onMarkCheckInComplete && (
        <ConfirmCheckInCompleteDialog
          missionaryName={pendingComplete.missionaryName}
          submitting={completing}
          error={confirmError}
          onDismiss={() => {
            if (completing) return;
            setPendingComplete(null);
            setConfirmError(null);
          }}
          onConfirm={() => {
            const followUp = pendingComplete;
            setConfirmError(null);
            void onMarkCheckInComplete(followUp)
              .then(() => {
                setPendingComplete(null);
              })
              .catch((err: unknown) => {
                setConfirmError(
                  err instanceof Error
                    ? err.message
                    : "Unable to mark this check-in complete."
                );
              });
          }}
        />
      )}
    </>
  );
}
