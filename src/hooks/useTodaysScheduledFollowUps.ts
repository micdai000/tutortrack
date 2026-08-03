import { useEffect, useRef, useState } from "react";

import {
  getTodaysScheduledFollowUps,
  markScheduledFollowUpComplete,
} from "../services/dashboardScheduledFollowUpService";
import type { ScheduledFollowUp } from "../types/dashboard";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseTodaysScheduledFollowUpsResult = {
  followUps: ScheduledFollowUp[];
  loading: boolean;
  error: string | null;
  completionMessage: string | null;
  completingMissionaryId: string | null;
  markComplete: (missionaryId: string) => Promise<void>;
};

/** Loads missionaries with follow_up_date today or overdue (not completed). */
export function useTodaysScheduledFollowUps(): UseTodaysScheduledFollowUpsResult {
  const [followUps, setFollowUps] = useState<ScheduledFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null
  );
  const [completingMissionaryId, setCompletingMissionaryId] = useState<
    string | null
  >(null);
  const messageTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      setLoading(true);
      setError(null);

      try {
        const rows = await getTodaysScheduledFollowUps();
        if (!cancelled) {
          setFollowUps(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setFollowUps([]);
          setError(
            getErrorMessage(err, "Unable to load today's scheduled follow-ups.")
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
  }, []);

  async function markComplete(missionaryId: string) {
    setCompletingMissionaryId(missionaryId);
    setError(null);

    try {
      await markScheduledFollowUpComplete(missionaryId);
      setFollowUps((current) =>
        current.filter((item) => item.missionaryId !== missionaryId)
      );

      if (messageTimer.current !== null) {
        window.clearTimeout(messageTimer.current);
      }
      setCompletionMessage("Follow-up marked complete.");
      messageTimer.current = window.setTimeout(() => {
        setCompletionMessage(null);
        messageTimer.current = null;
      }, 3000);
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Unable to mark this follow-up complete."
      );
      setError(message);
      throw new Error(message);
    } finally {
      setCompletingMissionaryId(null);
    }
  }

  return {
    followUps,
    loading,
    error,
    completionMessage,
    completingMissionaryId,
    markComplete,
  };
}
