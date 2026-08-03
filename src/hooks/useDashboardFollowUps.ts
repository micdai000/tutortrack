import { useEffect, useState } from "react";

import { getRedFollowUpsForDistrict } from "../services/dashboardFollowUpService";
import { refreshSubmissionConsistencyForDistrict } from "../services/submissionConsistencyService";
import type { DashboardFollowUp } from "../types/dashboard";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseDashboardFollowUpsResult = {
  followUps: DashboardFollowUp[];
  loading: boolean;
  error: string | null;
};

/**
 * Refreshes missed-submission insights, then loads RED follow-ups
 * for the selected dashboard district.
 */
export function useDashboardFollowUps(
  districtId: string | null
): UseDashboardFollowUpsResult {
  const [followUps, setFollowUps] = useState<DashboardFollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (!districtId) {
        setFollowUps([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        try {
          await refreshSubmissionConsistencyForDistrict(districtId);
        } catch (attendanceError) {
          // Still show existing follow-ups if refresh fails.
          console.warn(
            "Submission consistency refresh failed:",
            getErrorMessage(attendanceError, "unknown")
          );
        }

        const rows = await getRedFollowUpsForDistrict(districtId);
        if (!cancelled) {
          setFollowUps(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setFollowUps([]);
          setError(
            getErrorMessage(err, "Unable to load today's follow-ups.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [districtId]);

  return { followUps, loading, error };
}
