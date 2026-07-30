import { useNavigate } from "react-router-dom";
import { CalendarClock, Check } from "lucide-react";

import type { DashboardFollowUp } from "../../types/dashboard";
import type { District } from "../../types/district";
import { INSIGHT_CATEGORY_LABELS } from "../../types/renderAccount";
import { buildLanguageStudySessionHref } from "../../services/dashboardFollowUpService";
import { Card } from "../ui/Card";
import { Field, Icon, Select } from "../ui";

type TodaysFollowUpsProps = {
  districts: District[];
  districtId: string;
  followUps: DashboardFollowUp[];
  loading: boolean;
  error: string | null;
  onDistrictChange: (districtId: string) => void;
};

/** Daily action center: RED insight follow-ups for one district. */
export function TodaysFollowUps({
  districts,
  districtId,
  followUps,
  loading,
  error,
  onDistrictChange,
}: TodaysFollowUpsProps) {
  const navigate = useNavigate();

  return (
    <Card as="section" className="dashboard-followups">
      <div className="dashboard-section-header dashboard-section-header--flush">
        <h2>Today&apos;s Follow-Ups</h2>
        <Icon icon={CalendarClock} size="sm" tone="muted" />
      </div>

      {districts.length > 0 && (
        <div className="dashboard-followups__filter">
          <Field label="District" htmlFor="dashboard-followup-district">
            <Select
              id="dashboard-followup-district"
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
              No follow-ups needed today.
            </p>
            <p className="dashboard-followups__empty-description">
              All missionaries in this district are currently doing well based
              on their recent Render an Account sessions.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && followUps.length > 0 && (
        <ul className="dashboard-followups__list">
          {followUps.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="dashboard-followups__item"
                onClick={() =>
                  void navigate(buildLanguageStudySessionHref(item))
                }
              >
                <p className="dashboard-followups__item-title">
                  {item.missionaryName}
                </p>
                <p className="dashboard-followups__item-category">
                  {INSIGHT_CATEGORY_LABELS[item.insightCategory]}
                </p>
                <p className="dashboard-followups__item-reason-label">Reason</p>
                <p className="dashboard-followups__item-reason">{item.reason}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
