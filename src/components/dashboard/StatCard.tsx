import type { LucideIcon } from "lucide-react";

import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  loading?: boolean;
};

/** Compact statistic card for dashboard overview counts. */
export function StatCard({
  label,
  value,
  icon,
  loading = false,
}: StatCardProps) {
  return (
    <Card className="dashboard-stat-card" as="article">
      <div className="dashboard-stat-card__icon">
        <Icon icon={icon} size="md" tone="primary" />
      </div>
      <p className="dashboard-stat-card__value" aria-busy={loading || undefined}>
        {loading ? "—" : value}
      </p>
      <p className="dashboard-stat-card__label">{label}</p>
    </Card>
  );
}
