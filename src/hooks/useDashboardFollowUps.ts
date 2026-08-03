import { useEffect, useRef, useState } from "react";

import {
  getRedFollowUpsForDistrict,
  markInsightCheckInComplete,
} from "../services/dashboardFollowUpService";
import { refreshSubmissionConsistencyForDistrict } from "../services/submissionConsistencyService";
import type { DashboardFollowUp } from "../types/dashboard";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseDashboardFollowUpsResult = {
  followUps: DashboardFollowUp[];
  loading: boolean;
  error: string | null;
  completionMessage: string | null;
  completingInsightId: string | null;
  markCheckInComplete: (followUp: DashboardFollowUp) => Promise<void>;
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
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null
  );
  const [completingInsightId, setCompletingInsightId] = useState<string | null>(
    null
  );
  const messageTimer = useRef<number | null>(null);

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
      if (messageTimer.current !== null) {
        window.clearTimeout(messageTimer.current);
      }
    };
  }, [districtId]);

  async function markCheckInComplete(followUp: DashboardFollowUp) {
    setCompletingInsightId(followUp.id);
    setError(null);

    try {
      await markInsightCheckInComplete(followUp);
      setFollowUps((current) =>
        current.filter((item) => item.id !== followUp.id)
      );

      if (messageTimer.current !== null) {
        window.clearTimeout(messageTimer.current);
      }
      setCompletionMessage("Check-in marked complete.");
      messageTimer.current = window.setTimeout(() => {
        setCompletionMessage(null);
        messageTimer.current = null;
      }, 3000);
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Unable to mark this check-in complete."
      );
      setError(message);
      throw new Error(message);
    } finally {
      setCompletingInsightId(null);
    }
  }

  return {
    followUps,
    loading,
    error,
    completionMessage,
    completingInsightId,
    markCheckInComplete,
  };
}
