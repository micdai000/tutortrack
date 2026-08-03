import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  evaluateSubmissionConsistency,
  SUBMISSION_CONSISTENCY_CATEGORY,
  toDateKeyInTimeZone,
  todayDateKeyInTimeZone,
  type OpenSessionDay,
} from "./engines/submissionConsistency.ts";

const LOOKBACK_OPEN_DAYS = 2;
const DEFAULT_TIME_ZONE = "America/Denver";

type OpenSessionRow = {
  id: string;
  session_date: string;
};

type MissionaryRow = {
  id: string;
};

type SubmissionRow = {
  missionary_id: string;
  submitted_at: string;
};

/**
 * Recalculate SUBMISSION_CONSISTENCY for every missionary in a district.
 * Only fully elapsed opened session days count (session_date < today).
 */
export async function evaluateAndPersistSubmissionConsistencyForDistrict(
  admin: SupabaseClient,
  districtId: string,
  options?: {
    timeZone?: string;
    todayDateKey?: string;
  }
): Promise<{ evaluatedCount: number; redCount: number }> {
  const timeZone = options?.timeZone?.trim() || DEFAULT_TIME_ZONE;
  const todayDateKey =
    options?.todayDateKey?.trim() || todayDateKeyInTimeZone(timeZone);

  const lookbackDays = await loadPastOpenSessionDays(
    admin,
    districtId,
    todayDateKey
  );

  const missionaryIds = await loadDistrictMissionaryIds(admin, districtId);
  if (missionaryIds.length === 0) {
    return { evaluatedCount: 0, redCount: 0 };
  }

  const submissionsByMissionary = await loadSubmissionDateKeysByMissionary(
    admin,
    missionaryIds,
    lookbackDays,
    timeZone
  );

  const evaluatedAt = new Date().toISOString();
  let redCount = 0;

  const rows = missionaryIds.map((missionaryId) => {
    const evaluation = evaluateSubmissionConsistency(
      lookbackDays,
      submissionsByMissionary.get(missionaryId) ?? new Set()
    );

    if (evaluation.status === "red") {
      redCount += 1;
    }

    return {
      missionary_id: missionaryId,
      insight_category: SUBMISSION_CONSISTENCY_CATEGORY,
      status: evaluation.status,
      reason: evaluation.reason,
      supporting_session_ids: evaluation.supportingOpenSessionIds,
      last_evaluated_at: evaluatedAt,
      updated_at: evaluatedAt,
    };
  });

  const { error } = await admin
    .from("missionary_insight_records")
    .upsert(rows, { onConflict: "missionary_id,insight_category" });

  if (error) {
    throw new Error(
      `SUBMISSION_CONSISTENCY_UPSERT_FAILED:${error.message}`
    );
  }

  console.log(
    JSON.stringify({
      event: "submission_consistency_evaluated",
      district_id: districtId,
      today_date_key: todayDateKey,
      time_zone: timeZone,
      lookback_days: lookbackDays.map((day) => day.sessionDate),
      evaluated_count: missionaryIds.length,
      red_count: redCount,
    })
  );

  return {
    evaluatedCount: missionaryIds.length,
    redCount,
  };
}

/**
 * Recalculate SUBMISSION_CONSISTENCY for one missionary after they submit.
 */
export async function evaluateAndPersistSubmissionConsistencyForMissionary(
  admin: SupabaseClient,
  missionaryId: string,
  options?: {
    timeZone?: string;
    todayDateKey?: string;
  }
): Promise<void> {
  const { data: missionary, error: missionaryError } = await admin
    .from("missionaries")
    .select("id, companionship_id")
    .eq("id", missionaryId)
    .maybeSingle();

  if (missionaryError) {
    throw new Error(
      `SUBMISSION_CONSISTENCY_MISSIONARY_LOAD_FAILED:${missionaryError.message}`
    );
  }

  const companionshipId = (
    missionary as { companionship_id?: string } | null
  )?.companionship_id;

  if (!companionshipId) {
    return;
  }

  const { data: companionship, error: companionshipError } = await admin
    .from("companionships")
    .select("district_id")
    .eq("id", companionshipId)
    .maybeSingle();

  if (companionshipError) {
    throw new Error(
      `SUBMISSION_CONSISTENCY_COMPANIONSHIP_LOAD_FAILED:${companionshipError.message}`
    );
  }

  const districtId = (companionship as { district_id?: string } | null)
    ?.district_id;

  if (!districtId) {
    return;
  }

  await evaluateAndPersistSubmissionConsistencyForDistrict(
    admin,
    districtId,
    options
  );
}

async function loadPastOpenSessionDays(
  admin: SupabaseClient,
  districtId: string,
  todayDateKey: string
): Promise<OpenSessionDay[]> {
  const { data, error } = await admin
    .from("language_study_open_sessions")
    .select("id, session_date")
    .eq("district_id", districtId)
    .eq("status", "open")
    .lt("session_date", todayDateKey)
    .order("session_date", { ascending: false })
    .limit(LOOKBACK_OPEN_DAYS);

  if (error) {
    throw new Error(
      `SUBMISSION_CONSISTENCY_OPEN_SESSIONS_FAILED:${error.message}`
    );
  }

  return ((data ?? []) as OpenSessionRow[]).map((row) => ({
    id: row.id,
    sessionDate: row.session_date,
  }));
}

async function loadDistrictMissionaryIds(
  admin: SupabaseClient,
  districtId: string
): Promise<string[]> {
  const { data: companionships, error: companionshipError } = await admin
    .from("companionships")
    .select("id")
    .eq("district_id", districtId);

  if (companionshipError) {
    throw new Error(
      `SUBMISSION_CONSISTENCY_COMPANIONSHIPS_FAILED:${companionshipError.message}`
    );
  }

  const companionshipIds = (
    (companionships ?? []) as Array<{ id: string }>
  ).map((row) => row.id);

  if (companionshipIds.length === 0) {
    return [];
  }

  const { data, error } = await admin
    .from("missionaries")
    .select("id")
    .in("companionship_id", companionshipIds);

  if (error) {
    throw new Error(
      `SUBMISSION_CONSISTENCY_MISSIONARIES_FAILED:${error.message}`
    );
  }

  return ((data ?? []) as MissionaryRow[]).map((row) => row.id);
}

async function loadSubmissionDateKeysByMissionary(
  admin: SupabaseClient,
  missionaryIds: string[],
  lookbackDays: OpenSessionDay[],
  timeZone: string
): Promise<Map<string, Set<string>>> {
  const result = new Map<string, Set<string>>();
  for (const missionaryId of missionaryIds) {
    result.set(missionaryId, new Set());
  }

  if (lookbackDays.length === 0 || missionaryIds.length === 0) {
    return result;
  }

  const oldestDate = lookbackDays[lookbackDays.length - 1]!.sessionDate;
  // Pad one calendar day on each side so timezone conversion still lands in-range.
  const rangeStart = new Date(`${oldestDate}T00:00:00.000Z`);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 1);
  const newestDate = lookbackDays[0]!.sessionDate;
  const rangeEnd = new Date(`${newestDate}T00:00:00.000Z`);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 2);

  const { data, error } = await admin
    .from("render_form_submissions")
    .select("missionary_id, submitted_at")
    .in("missionary_id", missionaryIds)
    .eq("match_status", "matched")
    .not("submitted_at", "is", null)
    .gte("submitted_at", rangeStart.toISOString())
    .lt("submitted_at", rangeEnd.toISOString());

  if (error) {
    throw new Error(
      `SUBMISSION_CONSISTENCY_SUBMISSIONS_FAILED:${error.message}`
    );
  }

  const lookbackDateSet = new Set(lookbackDays.map((day) => day.sessionDate));

  for (const row of (data ?? []) as SubmissionRow[]) {
    const dateKey = toDateKeyInTimeZone(row.submitted_at, timeZone);
    if (!lookbackDateSet.has(dateKey)) continue;
    result.get(row.missionary_id)?.add(dateKey);
  }

  return result;
}
