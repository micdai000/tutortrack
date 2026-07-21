import { useEffect, useState } from "react";

import {
  createDistrict,
  deleteDistrict,
  getDistricts,
} from "../services/districtService";
import type { District } from "../types/district";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseDistrictsResult = {
  districts: District[];
  loading: boolean;
  error: string | null;
  create: (name: string) => Promise<void>;
  remove: (districtId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

/** Loads and mutates the current tutor's districts. */
export function useDistricts(): UseDistrictsResult {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const data = await getDistricts();
      setDistricts(data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load districts."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function create(name: string) {
    const created = await createDistrict(name);
    setDistricts((current) =>
      [...current, created].sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  async function remove(districtId: string) {
    await deleteDistrict(districtId);
    setDistricts((current) =>
      current.filter((district) => district.id !== districtId)
    );
  }

  return {
    districts,
    loading,
    error,
    create,
    remove,
    refresh,
  };
}
