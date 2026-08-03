import type { LucideIcon } from "lucide-react";

import type { DashboardFollowUp } from "../../types/dashboard";
import type { District } from "../../types/district";
import { Card } from "../ui/Card";
import { Field, Icon, Select } from "../ui";
import { FlaggedMissionaryList } from "./FlaggedMissionaryList";

type FlaggedMissionariesCardProps = {
  title: string;
  icon: LucideIcon;
  districts: District[];
  districtId: string;
  followUps: DashboardFollowUp[];
  loading: boolean;
  error: string | null;
  onDistrictChange: (districtId: string) => void;
  districtSelectId: string;
  emptyTitle: string;
  emptyDescription?: string;
  loadingLabel?: string;
  className?: string;
};

/**
 * Shared dashboard card shell for automatically flagged missionaries.
 * Presentation only — callers supply already-loaded follow-up data.
 */
export function FlaggedMissionariesCard({
  title,
  icon,
  districts,
  districtId,
  followUps,
  loading,
  error,
  onDistrictChange,
  districtSelectId,
  emptyTitle,
  emptyDescription,
  loadingLabel,
  className,
}: FlaggedMissionariesCardProps) {
  const cardClassName = ["dashboard-followups", className]
    .filter(Boolean)
    .join(" ");

  const headingId = `${districtSelectId}-heading`;
  const countLabel = loading ? "" : ` (${followUps.length})`;

  return (
    <Card as="section" className={cardClassName} aria-labelledby={headingId}>
      <div className="dashboard-section-header dashboard-section-header--flush">
        <h2 id={headingId}>
          {title}
          <span className="dashboard-section-header__count">{countLabel}</span>
        </h2>
        <Icon icon={icon} size="sm" tone="muted" />
      </div>

      {districts.length > 0 && (
        <div className="dashboard-followups__filter">
          <Field label="District" htmlFor={districtSelectId}>
            <Select
              id={districtSelectId}
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

      <FlaggedMissionaryList
        followUps={followUps}
        loading={loading}
        error={error}
        loadingLabel={loadingLabel}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </Card>
  );
}
