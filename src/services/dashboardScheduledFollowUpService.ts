import { supabase } from "../lib/supabase";
import type { ScheduledFollowUp } from "../types/dashboard";
import {
  compareScheduledFollowUps,
  resolveDashboardFollowUpUrgency,
} from "../utils/followUpStatus";
import { getErrorMessage } from "../utils/getErrorMessage";
import { toLocalDateKey } from "../utils/localDate";
import { clearMissionaryFollowUp } from "./missionaryService";

function throwQueryError(error: unknown): never {
  throw new Error(getErrorMessage(error, "Unexpected database error."));
}

type MissionaryQueryRow = {
  id: string;
  display_name: string;
  follow_up_date: string;
  follow_up_notes: string | null;
  companionship_id: string;
  companionships:
    | {
        id: string;
        district_id: string;
        districts:
          | { id: string; name: string }
          | { id: string; name: string }[]
          | null;
        missionaries: Array<{ id: string; display_name: string }> | null;
      }
    | Array<{
        id: string;
        district_id: string;
        districts:
          | { id: string; name: string }
          | { id: string; name: string }[]
          | null;
        missionaries: Array<{ id: string; display_name: string }> | null;
      }>
    | null;
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function buildCompanionshipLabel(
  members: Array<{ id: string; display_name: string }> | null | undefined
): string | null {
  if (!members || members.length === 0) return null;

  const names = members
    .slice()
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
    .map((member) => member.display_name);

  if (names.length === 0) return null;
  return names.join(" · ");
}

/**
 * Load missionaries with follow_up_date today or earlier (not yet completed).
 * Future dates are excluded. Sorted: overdue oldest-first, then today.
 */
export async function getTodaysScheduledFollowUps(
  todayDateKey = toLocalDateKey()
): Promise<ScheduledFollowUp[]> {
  const { data, error } = await supabase
    .from("missionaries")
    .select(
      `
      id,
      display_name,
      follow_up_date,
      follow_up_notes,
      companionship_id,
      companionships!inner (
        id,
        district_id,
        districts!inner (
          id,
          name
        ),
        missionaries (
          id,
          display_name
        )
      )
    `
    )
    .not("follow_up_date", "is", null)
    .lte("follow_up_date", todayDateKey)
    .order("follow_up_date", { ascending: true });

  if (error) throwQueryError(error);

  return ((data ?? []) as MissionaryQueryRow[])
    .map((row) => {
      const companionship = unwrapOne(row.companionships);
      const district = unwrapOne(companionship?.districts ?? null);
      if (!companionship || !district || !row.follow_up_date) return null;

      const urgency = resolveDashboardFollowUpUrgency(
        row.follow_up_date,
        todayDateKey
      ).urgency;

      return {
        id: row.id,
        missionaryId: row.id,
        missionaryName: row.display_name,
        districtId: district.id,
        districtName: district.name,
        companionshipId: companionship.id,
        companionshipLabel: buildCompanionshipLabel(companionship.missionaries),
        followUpDate: row.follow_up_date,
        followUpNotes: row.follow_up_notes?.trim() || null,
        urgency,
      } satisfies ScheduledFollowUp;
    })
    .filter((item): item is ScheduledFollowUp => item !== null)
    .sort((a, b) => compareScheduledFollowUps(a, b, todayDateKey));
}

/** Deep-link to the missionary language study plan / profile workspace. */
export function buildMissionaryFollowUpHref(
  followUp: ScheduledFollowUp
): string {
  return `/missionaries/${followUp.missionaryId}`;
}

/** Mark a scheduled follow-up complete by clearing date and notes. */
export async function markScheduledFollowUpComplete(
  missionaryId: string
): Promise<void> {
  await clearMissionaryFollowUp(missionaryId);
}
