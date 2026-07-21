import { useEffect, useState } from "react";

import {
  getCompanionshipById,
  toCompanionshipTeacherView,
} from "../services/companionshipService";
import type { TeacherViewData } from "../types/teacherView";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseCompanionshipTeacherViewResult = {
  teacherView: TeacherViewData | null;
  loading: boolean;
  error: string | null;
};

/**
 * Loads read-only Teacher View data for a companionship.
 * Reuses getCompanionshipById — no duplicate fetch logic.
 */
export function useCompanionshipTeacherView(
  companionshipId: string | undefined
): UseCompanionshipTeacherViewResult {
  const [teacherView, setTeacherView] = useState<TeacherViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!companionshipId) {
        setTeacherView(null);
        setError("Companionship not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const workspace = await getCompanionshipById(companionshipId);

        if (cancelled) return;

        if (!workspace) {
          setTeacherView(null);
          setError("Companionship not found.");
          return;
        }

        setTeacherView(toCompanionshipTeacherView(workspace));
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Unable to load Teacher View."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [companionshipId]);

  return { teacherView, loading, error };
}
