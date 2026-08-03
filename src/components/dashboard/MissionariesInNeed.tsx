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
  completionMessage: string | null;
  completingInsightId: string | null;
  onDistrictChange: (districtId: string) => void;
  onMarkCheckInComplete: (followUp: DashboardFollowUp) => Promise<void>;
};

/** Permanent home for missionaries automatically flagged by Render an Account. */
export function MissionariesInNeed({
  districts,
  districtId,
  followUps,
  loading,
  error,
  completionMessage,
  completingInsightId,
  onDistrictChange,
  onMarkCheckInComplete,
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
      emptyTitle="No missionaries need attention right now."
      completionMessage={completionMessage}
      completingInsightId={completingInsightId}
      onMarkCheckInComplete={onMarkCheckInComplete}
    />
  );
}
