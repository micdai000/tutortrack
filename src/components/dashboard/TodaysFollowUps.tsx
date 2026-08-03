import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock } from "lucide-react";

import type { ScheduledFollowUp } from "../../types/dashboard";
import { buildMissionaryFollowUpHref } from "../../services/dashboardScheduledFollowUpService";
import { formatFollowUpScheduledDate } from "../../utils/followUpStatus";
import { StatusBadge } from "../layout";
import { Card } from "../ui/Card";
import { Button, Icon } from "../ui";
import { ConfirmCompleteFollowUpDialog } from "./ConfirmCompleteFollowUpDialog";
import { DashboardEmptyState } from "./DashboardEmptyState";

type TodaysFollowUpsProps = {
  followUps: ScheduledFollowUp[];
  loading: boolean;
  error: string | null;
  completionMessage: string | null;
  completingMissionaryId: string | null;
  onMarkComplete: (missionaryId: string) => Promise<void>;
};

/**
 * Active manual follow-ups: due today or overdue.
 * Independent from Missionaries in Need / Render an Account flags.
 */
export function TodaysFollowUps({
  followUps,
  loading,
  error,
  completionMessage,
  completingMissionaryId,
  onMarkComplete,
}: TodaysFollowUpsProps) {
  const navigate = useNavigate();
  const [pendingComplete, setPendingComplete] =
    useState<ScheduledFollowUp | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const completing =
    pendingComplete !== null &&
    completingMissionaryId === pendingComplete.missionaryId;

  const countLabel = loading ? "" : ` (${followUps.length})`;

  return (
    <Card
      as="section"
      className="dashboard-followups"
      aria-labelledby="dashboard-todays-followups-heading"
    >
      <div className="dashboard-section-header dashboard-section-header--flush">
        <h2 id="dashboard-todays-followups-heading">
          Today&apos;s Follow-Ups
          <span className="dashboard-section-header__count">{countLabel}</span>
        </h2>
        <Icon icon={CalendarClock} size="sm" tone="muted" />
      </div>

      {completionMessage && (
        <p className="dashboard-followups__toast" role="status">
          {completionMessage}
        </p>
      )}

      {loading && (
        <p className="dashboard-status" role="status">
          Loading follow-ups...
        </p>
      )}

      {!loading && error && !pendingComplete && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && followUps.length === 0 && (
        <DashboardEmptyState title="No active follow-ups." />
      )}

      {!loading && followUps.length > 0 && (
        <ul className="dashboard-followups__list">
          {followUps.map((item) => {
            const isOverdue = item.urgency === "overdue";
            const itemClassName = [
              "dashboard-followups__item",
              "dashboard-followups__item--scheduled",
              isOverdue ? "dashboard-followups__item--overdue" : null,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li key={item.id}>
                <div className={itemClassName}>
                  <button
                    type="button"
                    className="dashboard-followups__item-main"
                    aria-label={`Open profile for ${item.missionaryName}`}
                    onClick={() =>
                      void navigate(buildMissionaryFollowUpHref(item))
                    }
                  >
                    <div className="dashboard-followups__item-heading">
                      <p className="dashboard-followups__item-title">
                        {item.missionaryName}
                      </p>
                      <StatusBadge tone={isOverdue ? "warning" : "info"}>
                        {isOverdue ? "Overdue" : "Today"}
                      </StatusBadge>
                    </div>

                    <dl className="dashboard-followups__item-meta-list">
                      <div>
                        <dt>District</dt>
                        <dd>{item.districtName}</dd>
                      </div>
                      {item.companionshipLabel ? (
                        <div>
                          <dt>Companionship</dt>
                          <dd>{item.companionshipLabel}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt>Scheduled</dt>
                        <dd>
                          {formatFollowUpScheduledDate(item.followUpDate)}
                        </dd>
                      </div>
                    </dl>

                    {item.followUpNotes ? (
                      <p className="dashboard-followups__item-notes">
                        {item.followUpNotes}
                      </p>
                    ) : (
                      <p className="dashboard-followups__item-notes dashboard-followups__item-notes--empty">
                        No notes
                      </p>
                    )}
                  </button>

                  <div className="dashboard-followups__item-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={completingMissionaryId !== null}
                      aria-label={`Mark follow-up complete for ${item.missionaryName}`}
                      onClick={() => {
                        setConfirmError(null);
                        setPendingComplete(item);
                      }}
                    >
                      Mark Complete
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pendingComplete && (
        <ConfirmCompleteFollowUpDialog
          missionaryName={pendingComplete.missionaryName}
          submitting={completing}
          error={confirmError}
          onDismiss={() => {
            if (completing) return;
            setPendingComplete(null);
            setConfirmError(null);
          }}
          onConfirm={() => {
            const missionaryId = pendingComplete.missionaryId;
            setConfirmError(null);
            void onMarkComplete(missionaryId)
              .then(() => {
                setPendingComplete(null);
              })
              .catch((err: unknown) => {
                setConfirmError(
                  err instanceof Error
                    ? err.message
                    : "Unable to mark this follow-up complete."
                );
              });
          }}
        />
      )}
    </Card>
  );
}
