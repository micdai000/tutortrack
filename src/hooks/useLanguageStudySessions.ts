import { useEffect, useState } from "react";

import { getLanguageStudyDayView } from "../services/languageStudySessionService";
import type { LanguageStudyDayView } from "../types/languageStudySession";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseLanguageStudySessionsResult = {
  dayView: LanguageStudyDayView | null;
  loading: boolean;
  error: string | null;
};

/**
 * Loads Language Study Sessions for one district + local date.
 * Reloads whenever districtId or dateKey changes.
 */
export function useLanguageStudySessions(
  districtId: string | null,
  dateKey: string
): UseLanguageStudySessionsResult {
  const [dayView, setDayView] = useState<LanguageStudyDayView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (!districtId) {
        setDayView(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const view = await getLanguageStudyDayView(districtId, dateKey);
        if (!cancelled) {
          setDayView(view);
        }
      } catch (err) {
        if (!cancelled) {
          setDayView(null);
          setError(
            getErrorMessage(err, "Unable to load Language Study Sessions.")
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
  }, [districtId, dateKey]);

  return { dayView, loading, error };
}
