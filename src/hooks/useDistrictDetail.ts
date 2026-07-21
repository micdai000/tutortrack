import { useEffect, useState } from "react";

import {
  createCompanionshipWithMissionaries,
  getCompanionshipsByDistrict,
} from "../services/companionshipService";
import { getDistrictById } from "../services/districtService";
import type { CompanionshipWithMissionaries } from "../types/companionship";
import type { District } from "../types/district";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseDistrictDetailResult = {
  district: District | null;
  companionships: CompanionshipWithMissionaries[];
  loading: boolean;
  error: string | null;
  createCompanionship: (missionaryNames: string[]) => Promise<void>;
  refresh: () => Promise<void>;
};

/** Loads one district and its companionships for the detail page. */
export function useDistrictDetail(
  districtId: string | undefined
): UseDistrictDetailResult {
  const [district, setDistrict] = useState<District | null>(null);
  const [companionships, setCompanionships] = useState<
    CompanionshipWithMissionaries[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!districtId) {
      setDistrict(null);
      setCompanionships([]);
      setError("District not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [districtData, companionshipData] = await Promise.all([
        getDistrictById(districtId),
        getCompanionshipsByDistrict(districtId),
      ]);

      if (!districtData) {
        setDistrict(null);
        setCompanionships([]);
        setError("District not found.");
        return;
      }

      setDistrict(districtData);
      setCompanionships(companionshipData);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load district details."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [districtId]);

  async function createCompanionship(missionaryNames: string[]) {
    if (!districtId) {
      throw new Error("District not found.");
    }

    const created = await createCompanionshipWithMissionaries(
      districtId,
      missionaryNames
    );

    setCompanionships((current) => [...current, created]);
  }

  return {
    district,
    companionships,
    loading,
    error,
    createCompanionship,
    refresh,
  };
}
