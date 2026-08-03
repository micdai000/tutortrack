import { HeartHandshake } from "lucide-react";

import type { DashboardFollowUp } from "../../types/dashboard";
import type { District } from "../../types/district";
import { FlaggedMissionariesCard } from "./FlaggedMissionariesCard";

type MissionariesInNeedProps = {
  districts: District[];
  districtId: string;
  followUps: DashboardFollowUp[];
  loading: boolean;
  error: string | null;
  onDistrictChange: (districtId: string) => void;
};

/**
 * Permanent home for missionaries automatically flagged by Render an Account.
 * Uses the same follow-up data as Today's Follow-Ups during the transition.
 */
export function MissionariesInNeed({
  districts,
  districtId,
  followUps,
  loading,
  error,
  onDistrictChange,
}: MissionariesInNeedProps) {
  return (
    <FlaggedMissionariesCard
      title="Missionaries in Need"
      icon={HeartHandshake}
      className="dashboard-missionaries-in-need"
      districts={districts}
      districtId={districtId}
      followUps={followUps}
      loading={loading}
      error={error}
      onDistrictChange={onDistrictChange}
      districtSelectId="dashboard-missionaries-in-need-district"
      loadingLabel="Loading missionaries in need..."
      emptyTitle="No missionaries currently require additional attention."
    />
  );
}
