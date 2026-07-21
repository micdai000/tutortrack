import { useEffect, useRef, useState } from "react";

import {
  getMissionaryById,
  toMissionaryDraft,
  updateMissionaryProfile,
} from "../services/missionaryService";
import type {
  MissionaryProfile,
  MissionaryProfileDraft,
  MissionarySaveStatus,
} from "../types/missionary";
import { getErrorMessage } from "../utils/getErrorMessage";

const AUTO_SAVE_DELAY_MS = 1000;

type UseMissionaryProfileResult = {
  missionary: MissionaryProfile | null;
  draft: MissionaryProfileDraft | null;
  loading: boolean;
  loadError: string | null;
  saveStatus: MissionarySaveStatus;
  saveError: string | null;
  updateField: <K extends keyof MissionaryProfileDraft>(
    field: K,
    value: MissionaryProfileDraft[K]
  ) => void;
};

/** Loads a missionary profile and auto-saves draft changes after idle typing. */
export function useMissionaryProfile(
  missionaryId: string | undefined
): UseMissionaryProfileResult {
  const [missionary, setMissionary] = useState<MissionaryProfile | null>(null);
  const [draft, setDraft] = useState<MissionaryProfileDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<MissionarySaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Avoid saving the initial draft hydration from the server.
  const hasUserEdited = useRef(false);
  const saveRequestId = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!missionaryId) {
        setMissionary(null);
        setDraft(null);
        setLoadError("Missionary not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);
      hasUserEdited.current = false;

      try {
        const data = await getMissionaryById(missionaryId);

        if (cancelled) return;

        if (!data) {
          setMissionary(null);
          setDraft(null);
          setLoadError("Missionary not found.");
          return;
        }

        setMissionary(data);
        setDraft(toMissionaryDraft(data));
        setSaveStatus("saved");
        setSaveError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          getErrorMessage(err, "Unable to load missionary profile.")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [missionaryId]);

  useEffect(() => {
    if (!missionaryId || !draft || !hasUserEdited.current) {
      return;
    }

    setSaveStatus("typing");
    setSaveError(null);

    const requestId = ++saveRequestId.current;

    const timer = window.setTimeout(() => {
      void (async () => {
        setSaveStatus("saving");

        try {
          const updated = await updateMissionaryProfile(missionaryId, draft);

          // Ignore stale responses if a newer edit started another save.
          if (requestId !== saveRequestId.current) return;

          setMissionary(updated);
          setSaveStatus("saved");
          setSaveError(null);
        } catch (err) {
          if (requestId !== saveRequestId.current) return;

          setSaveStatus("error");
          setSaveError(
            getErrorMessage(err, "Unable to save changes. Keep editing — we will try again.")
          );
        }
      })();
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, missionaryId]);

  function updateField<K extends keyof MissionaryProfileDraft>(
    field: K,
    value: MissionaryProfileDraft[K]
  ) {
    hasUserEdited.current = true;
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  return {
    missionary,
    draft,
    loading,
    loadError,
    saveStatus,
    saveError,
    updateField,
  };
}
