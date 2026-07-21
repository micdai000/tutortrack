import { useEffect, useState } from "react";

import { getTeacherViewByShareToken } from "../services/teacherShareService";
import type { TeacherViewData } from "../types/teacherView";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseSharedTeacherViewResult = {
  teacherView: TeacherViewData | null;
  loading: boolean;
  unavailable: boolean;
  error: string | null;
};

/** Loads a public Teacher View by share token (no sign-in required). */
export function useSharedTeacherView(
  token: string | undefined
): UseSharedTeacherViewResult {
  const [teacherView, setTeacherView] = useState<TeacherViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token?.trim()) {
        setTeacherView(null);
        setUnavailable(true);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setUnavailable(false);
      setError(null);

      try {
        const data = await getTeacherViewByShareToken(token);

        if (!data) {
          setTeacherView(null);
          setUnavailable(true);
          return;
        }

        setTeacherView(data);
        setUnavailable(false);
      } catch (err) {
        setTeacherView(null);
        setUnavailable(false);
        setError(
          getErrorMessage(err, "Unable to open this shared Teacher View.")
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token]);

  return { teacherView, loading, unavailable, error };
}
