import type { LucideIcon } from "lucide-react";

import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";

type DistrictSummaryCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
};

/** Compact summary metric for the district workspace. */
export function DistrictSummaryCard({
  label,
  value,
  icon,
}: DistrictSummaryCardProps) {
  return (
    <Card as="article" className="district-summary-card">
      <div className="district-summary-card__icon">
        <Icon icon={icon} size="md" tone="primary" />
      </div>
      <p className="district-summary-card__value">{value}</p>
      <p className="district-summary-card__label">{label}</p>
    </Card>
  );
}
