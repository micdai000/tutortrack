import { useEffect, useState } from "react";

import {
  getDistrictTeacherViewSource,
  toDistrictTeacherView,
} from "../services/companionshipService";
import type { TeacherViewData } from "../types/teacherView";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseDistrictTeacherViewResult = {
  teacherView: TeacherViewData | null;
  loading: boolean;
  error: string | null;
};

/** Loads a district-scoped, read-only Teacher View document. */
export function useDistrictTeacherView(
  districtId: string | undefined
): UseDistrictTeacherViewResult {
  const [teacherView, setTeacherView] = useState<TeacherViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!districtId) {
        setTeacherView(null);
        setError("District not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const source = await getDistrictTeacherViewSource(districtId);

        if (!source) {
          setTeacherView(null);
          setError("District not found.");
          return;
        }

        setTeacherView(toDistrictTeacherView(source));
      } catch (err) {
        setTeacherView(null);
        setError(getErrorMessage(err, "Unable to load District Teacher View."));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [districtId]);

  return { teacherView, loading, error };
}
