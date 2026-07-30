import { useEffect, useState } from "react";

import { getCompanionshipsByDistrict } from "../services/companionshipService";
import type {
  DashboardStats,
  DistrictSummary,
} from "../types/dashboardOverview";
import { getErrorMessage } from "../utils/getErrorMessage";
import { useDistricts } from "./useDistricts";

type UseDashboardOverviewResult = {
  districts: DistrictSummary[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
};

/**
 * Dashboard read model built from existing services only.
 * Does not create, update, or delete any records.
 */
export function useDashboardOverview(): UseDashboardOverviewResult {
  const { districts, loading: districtsLoading, error: districtsError } =
    useDistricts();
  const [summaries, setSummaries] = useState<DistrictSummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [summariesError, setSummariesError] = useState<string | null>(null);

  useEffect(() => {
    if (districtsLoading) return;

    let cancelled = false;

    async function loadSummaries() {
      setSummariesLoading(true);
      setSummariesError(null);

      try {
        const next = await Promise.all(
          districts.map(async (district) => {
            const companionships = await getCompanionshipsByDistrict(
              district.id
            );
            const missionaryCount = companionships.reduce(
              (total, companionship) =>
                total + companionship.missionaries.length,
              0
            );

            return {
              ...district,
              companionshipCount: companionships.length,
              missionaryCount,
            } satisfies DistrictSummary;
          })
        );

        if (!cancelled) {
          setSummaries(next);
        }
      } catch (err) {
        if (!cancelled) {
          setSummaries([]);
          setSummariesError(
            getErrorMessage(err, "Unable to load district details.")
          );
        }
      } finally {
        if (!cancelled) {
          setSummariesLoading(false);
        }
      }
    }

    void loadSummaries();

    return () => {
      cancelled = true;
    };
  }, [districts, districtsLoading]);

  const stats: DashboardStats = {
    districtCount: summaries.length,
    companionshipCount: summaries.reduce(
      (total, district) => total + district.companionshipCount,
      0
    ),
    missionaryCount: summaries.reduce(
      (total, district) => total + district.missionaryCount,
      0
    ),
    followUpCount: 0,
  };

  return {
    districts: summaries,
    stats,
    loading: districtsLoading || summariesLoading,
    error: districtsError ?? summariesError,
  };
}
