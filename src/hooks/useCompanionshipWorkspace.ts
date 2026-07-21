import { useEffect, useState } from "react";

import {
  deleteCompanionship,
  getCompanionshipById,
  type CompanionshipWorkspaceData,
} from "../services/companionshipService";
import {
  addMissionaryToCompanionship,
  removeMissionaryFromCompanionship,
  updateMissionaryDisplayName,
} from "../services/missionaryService";
import type { Missionary } from "../types/missionary";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseCompanionshipWorkspaceResult = {
  workspace: CompanionshipWorkspaceData | null;
  loading: boolean;
  error: string | null;
  addMissionary: (name: string) => Promise<void>;
  renameMissionary: (missionary: Missionary, name: string) => Promise<void>;
  removeMissionary: (missionary: Missionary) => Promise<void>;
  deleteCurrentCompanionship: () => Promise<string>;
  refresh: () => Promise<void>;
};

/** Loads one companionship workspace and supports missionary membership changes. */
export function useCompanionshipWorkspace(
  companionshipId: string | undefined
): UseCompanionshipWorkspaceResult {
  const [workspace, setWorkspace] =
    useState<CompanionshipWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh(options?: { silent?: boolean }) {
    if (!companionshipId) {
      setWorkspace(null);
      setError("Companionship not found.");
      setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getCompanionshipById(companionshipId);

      if (!data) {
        setWorkspace(null);
        setError("Companionship not found.");
        return;
      }

      setWorkspace(data);
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to load companionship workspace.")
      );
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refresh();
  }, [companionshipId]);

  async function addMissionary(name: string) {
    if (!companionshipId) {
      throw new Error("Companionship not found.");
    }

    await addMissionaryToCompanionship(companionshipId, name);
    await refresh({ silent: true });
  }

  async function renameMissionary(missionary: Missionary, name: string) {
    await updateMissionaryDisplayName(missionary.id, name);
    await refresh({ silent: true });
  }

  async function removeMissionary(missionary: Missionary) {
    if (!companionshipId) {
      throw new Error("Companionship not found.");
    }

    await removeMissionaryFromCompanionship(missionary.id, companionshipId);
    await refresh({ silent: true });
  }

  /** Deletes the current companionship and returns its district id for navigation. */
  async function deleteCurrentCompanionship(): Promise<string> {
    if (!companionshipId || !workspace) {
      throw new Error("Companionship not found.");
    }

    const districtId = workspace.district.id;
    await deleteCompanionship(companionshipId);
    setWorkspace(null);
    return districtId;
  }

  return {
    workspace,
    loading,
    error,
    addMissionary,
    renameMissionary,
    removeMissionary,
    deleteCurrentCompanionship,
    refresh,
  };
}
