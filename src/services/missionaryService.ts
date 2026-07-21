import { supabase } from "../lib/supabase";
import type {
  Missionary,
  MissionaryProfile,
  MissionaryProfileDraft,
} from "../types/missionary";
import { getErrorMessage } from "../utils/getErrorMessage";

function throwQueryError(error: unknown): never {
  throw new Error(getErrorMessage(error, "Unexpected database error."));
}

const PROFILE_COLUMNS =
  "id, companionship_id, display_name, short_term_goal, current_study_plan, tutor_notes, long_term_goal, follow_up_date, last_updated_at, created_at";

const LIST_COLUMNS = "id, companionship_id, display_name, created_at";

/** Load one missionary profile by id (RLS enforces ownership). */
export async function getMissionaryById(
  missionaryId: string
): Promise<MissionaryProfile | null> {
  const { data, error } = await supabase
    .from("missionaries")
    .select(PROFILE_COLUMNS)
    .eq("id", missionaryId)
    .maybeSingle();

  if (error) throwQueryError(error);
  return data;
}

/** Persist current profile values and bump last_updated_at. */
export async function updateMissionaryProfile(
  missionaryId: string,
  draft: MissionaryProfileDraft
): Promise<MissionaryProfile> {
  const displayName = draft.display_name.trim();

  if (!displayName) {
    throw new Error("Name is required.");
  }

  const { data, error } = await supabase
    .from("missionaries")
    .update({
      display_name: displayName,
      short_term_goal: draft.short_term_goal.trim() || null,
      current_study_plan: draft.current_study_plan.trim() || null,
      tutor_notes: draft.tutor_notes.trim() || null,
      long_term_goal: draft.long_term_goal.trim() || null,
      follow_up_date: draft.follow_up_date || null,
      last_updated_at: new Date().toISOString(),
    })
    .eq("id", missionaryId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throwQueryError(error);
  return data;
}

/** Map a profile record into controlled form draft values. */
export function toMissionaryDraft(
  profile: MissionaryProfile
): MissionaryProfileDraft {
  return {
    display_name: profile.display_name,
    short_term_goal: profile.short_term_goal ?? "",
    current_study_plan: profile.current_study_plan ?? "",
    tutor_notes: profile.tutor_notes ?? "",
    long_term_goal: profile.long_term_goal ?? "",
    follow_up_date: profile.follow_up_date ?? "",
  };
}

/** Update only a missionary's display name. */
export async function updateMissionaryDisplayName(
  missionaryId: string,
  name: string
): Promise<Missionary> {
  const displayName = name.trim();

  if (!displayName) {
    throw new Error("Name is required.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to rename a missionary.");
  }

  const { data, error } = await supabase
    .from("missionaries")
    .update({
      display_name: displayName,
      last_updated_at: new Date().toISOString(),
    })
    .eq("id", missionaryId)
    .select(LIST_COLUMNS)
    .single();

  if (error) throwQueryError(error);
  return data;
}

/** Add a missionary to an existing companionship. */
export async function addMissionaryToCompanionship(
  companionshipId: string,
  name: string
): Promise<Missionary> {
  const displayName = name.trim();

  if (!displayName) {
    throw new Error("Name is required.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to add a missionary.");
  }

  const { data, error } = await supabase
    .from("missionaries")
    .insert({
      companionship_id: companionshipId,
      display_name: displayName,
    })
    .select(LIST_COLUMNS)
    .single();

  if (error) throwQueryError(error);
  return data;
}

/**
 * Remove a missionary from a companionship.
 * Enforces the rule: companionships must keep at least two missionaries.
 */
export async function removeMissionaryFromCompanionship(
  missionaryId: string,
  companionshipId: string
): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to remove a missionary.");
  }

  const { count, error: countError } = await supabase
    .from("missionaries")
    .select("id", { count: "exact", head: true })
    .eq("companionship_id", companionshipId);

  if (countError) throwQueryError(countError);

  if ((count ?? 0) <= 2) {
    throw new Error(
      "A companionship must contain at least two missionaries. If this companionship no longer exists, delete the companionship instead."
    );
  }

  const { error } = await supabase
    .from("missionaries")
    .delete()
    .eq("id", missionaryId)
    .eq("companionship_id", companionshipId);

  if (error) throwQueryError(error);
}
