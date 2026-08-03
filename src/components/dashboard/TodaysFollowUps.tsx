import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Check } from "lucide-react";

import type { ScheduledFollowUp } from "../../types/dashboard";
import { buildMissionaryFollowUpHref } from "../../services/dashboardScheduledFollowUpService";
import { formatFollowUpScheduledDate } from "../../utils/followUpStatus";
import { Card } from "../ui/Card";
import { Button, Icon } from "../ui";
import { ConfirmCompleteFollowUpDialog } from "./ConfirmCompleteFollowUpDialog";

type TodaysFollowUpsProps = {
  followUps: ScheduledFollowUp[];
  loading: boolean;
  error: string | null;
  completionMessage: string | null;
  completingMissionaryId: string | null;
  onMarkComplete: (missionaryId: string) => void;
};

/**
 * Manually scheduled follow-ups due today (missionaries.follow_up_date).
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

  const completing =
    pendingComplete !== null &&
    completingMissionaryId === pendingComplete.missionaryId;

  return (
    <Card as="section" className="dashboard-followups">
      <div className="dashboard-section-header dashboard-section-header--flush">
        <h2>Today&apos;s Follow-Ups ({followUps.length})</h2>
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

      {!loading && error && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && followUps.length === 0 && (
        <div className="dashboard-followups__empty">
          <span className="dashboard-followups__check" aria-hidden="true">
            <Icon icon={Check} size="sm" tone="primary" />
          </span>
          <div className="dashboard-followups__empty-copy">
            <p className="dashboard-followups__empty-title">
              No follow-ups scheduled for today.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && followUps.length > 0 && (
        <ul className="dashboard-followups__list">
          {followUps.map((item) => (
            <li key={item.id}>
              <div className="dashboard-followups__item dashboard-followups__item--scheduled">
                <button
                  type="button"
                  className="dashboard-followups__item-main"
                  onClick={() =>
                    void navigate(buildMissionaryFollowUpHref(item))
                  }
                >
                  <p className="dashboard-followups__item-title">
                    {item.missionaryName}
                  </p>
                  <p className="dashboard-followups__item-meta">
                    District {item.districtName}
                  </p>
                  {item.companionshipLabel ? (
                    <p className="dashboard-followups__item-meta">
                      Companionship {item.companionshipLabel}
                    </p>
                  ) : null}
                  <p className="dashboard-followups__item-meta">
                    Scheduled {formatFollowUpScheduledDate(item.followUpDate)}
                  </p>
                  {item.followUpNotes ? (
                    <p className="dashboard-followups__item-notes">
                      {item.followUpNotes}
                    </p>
                  ) : (
                    <p className="dashboard-followups__item-notes dashboard-followups__item-notes--empty">
                      No follow-up notes.
                    </p>
                  )}
                </button>

                <div className="dashboard-followups__item-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={completingMissionaryId !== null}
                    onClick={() => setPendingComplete(item)}
                  >
                    Mark Complete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pendingComplete && (
        <ConfirmCompleteFollowUpDialog
          missionaryName={pendingComplete.missionaryName}
          submitting={completing}
          error={null}
          onDismiss={() => {
            if (completing) return;
            setPendingComplete(null);
          }}
          onConfirm={() => {
            const missionaryId = pendingComplete.missionaryId;
            void Promise.resolve(onMarkComplete(missionaryId)).finally(() => {
              setPendingComplete(null);
            });
          }}
        />
      )}
    </Card>
  );
}
