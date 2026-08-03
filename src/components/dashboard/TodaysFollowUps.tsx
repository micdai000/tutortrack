import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ChevronDown } from "lucide-react";

import type { ScheduledFollowUp } from "../../types/dashboard";
import type { District } from "../../types/district";
import { buildMissionaryFollowUpHref } from "../../services/dashboardScheduledFollowUpService";
import { formatFollowUpScheduledDate } from "../../utils/followUpStatus";
import { StatusBadge } from "../layout";
import { Card } from "../ui/Card";
import { Button, Field, Icon, Select } from "../ui";
import { ConfirmCompleteFollowUpDialog } from "./ConfirmCompleteFollowUpDialog";
import { DashboardEmptyState } from "./DashboardEmptyState";

type TodaysFollowUpsProps = {
  districts: District[];
  districtId: string;
  followUps: ScheduledFollowUp[];
  loading: boolean;
  error: string | null;
  completionMessage: string | null;
  completingMissionaryId: string | null;
  onDistrictChange: (districtId: string) => void;
  onMarkComplete: (missionaryId: string) => Promise<void>;
};

/**
 * Active manual follow-ups: due today or overdue.
 * Independent from Missionaries in Need / Render an Account flags.
 */
export function TodaysFollowUps({
  districts,
  districtId,
  followUps,
  loading,
  error,
  completionMessage,
  completingMissionaryId,
  onDistrictChange,
  onMarkComplete,
}: TodaysFollowUpsProps) {
  const navigate = useNavigate();
  const [pendingComplete, setPendingComplete] =
    useState<ScheduledFollowUp | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completing =
    pendingComplete !== null &&
    completingMissionaryId === pendingComplete.missionaryId;

  const visibleFollowUps = districtId
    ? followUps.filter((item) => item.districtId === districtId)
    : followUps;

  useEffect(() => {
    setExpandedId(null);
  }, [districtId]);

  useEffect(() => {
    if (
      expandedId !== null &&
      !visibleFollowUps.some((item) => item.id === expandedId)
    ) {
      setExpandedId(null);
    }
  }, [expandedId, visibleFollowUps]);

  const countLabel = loading ? "" : ` (${visibleFollowUps.length})`;

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

      {districts.length > 0 && (
        <div className="dashboard-followups__filter">
          <Field
            label="District"
            htmlFor="dashboard-todays-followups-district"
          >
            <Select
              id="dashboard-todays-followups-district"
              value={districtId}
              onChange={(event) => onDistrictChange(event.target.value)}
            >
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

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

      {!loading && !error && visibleFollowUps.length === 0 && (
        <DashboardEmptyState title="No active follow-ups." />
      )}

      {!loading && visibleFollowUps.length > 0 && (
        <ul className="dashboard-followups__list">
          {visibleFollowUps.map((item) => {
            const isOverdue = item.urgency === "overdue";
            const isExpanded = expandedId === item.id;
            const panelId = `dashboard-followup-panel-${item.id}`;
            const itemClassName = [
              "dashboard-followups__item",
              "dashboard-followups__item--scheduled",
              "dashboard-followups__item--collapsible",
              isOverdue ? "dashboard-followups__item--overdue" : null,
              isExpanded
                ? "dashboard-followups__item--expanded"
                : "dashboard-followups__item--collapsed",
            ]
              .filter(Boolean)
              .join(" ");

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
                      <p className="dashboard-followups__item-title">
                        {item.missionaryName}
                      </p>
                      <div className="dashboard-followups__item-heading-meta">
                        <StatusBadge tone={isOverdue ? "warning" : "info"}>
                          {isOverdue ? "Overdue" : "Today"}
                        </StatusBadge>
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
                    </div>
                  </button>

                  {isExpanded && (
                    <div
                      id={panelId}
                      className="dashboard-followups__item-details"
                    >
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Open profile for ${item.missionaryName}`}
                          onClick={() =>
                            void navigate(buildMissionaryFollowUpHref(item))
                          }
                        >
                          Open profile
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
