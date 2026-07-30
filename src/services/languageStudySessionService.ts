import { supabase } from "../lib/supabase";
import { getCompanionshipsByDistrict } from "./companionshipService";
import { getRenderAccount } from "./renderAccountService";
import type {
  LanguageStudyAnswer,
  LanguageStudyDayView,
  LanguageStudyMissionaryRow,
  LanguageStudySession,
} from "../types/languageStudySession";
import { getErrorMessage } from "../utils/getErrorMessage";
import { getLocalDayBounds } from "../utils/localDate";

function throwQueryError(error: unknown): never {
  throw new Error(getErrorMessage(error, "Unexpected database error."));
}

const SUBMISSION_COLUMNS =
  "id, render_account_id, missionary_id, who_are_you_label, match_status, submitted_at, created_at";

const ANSWER_COLUMNS =
  "id, submission_id, render_question_id, google_question_id, question_text, response_type, insight_category, response_value, created_at";

type SubmissionQueryRow = {
  id: string;
  render_account_id: string;
  missionary_id: string | null;
  who_are_you_label: string | null;
  match_status: "matched" | "unmatched";
  submitted_at: string | null;
  created_at: string;
  render_form_answers: LanguageStudyAnswer[] | null;
};

function mapSession(row: SubmissionQueryRow): LanguageStudySession {
  const answers = [...(row.render_form_answers ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  return {
    id: row.id,
    render_account_id: row.render_account_id,
    missionary_id: row.missionary_id,
    who_are_you_label: row.who_are_you_label,
    match_status: row.match_status,
    submitted_at: row.submitted_at,
    created_at: row.created_at,
    answers,
  };
}

/** Load submissions (with answers) for a render account within a local day. */
async function getSessionsForDay(
  renderAccountId: string,
  dateKey: string
): Promise<LanguageStudySession[]> {
  const { startIso, endIso } = getLocalDayBounds(dateKey);

  const { data, error } = await supabase
    .from("render_form_submissions")
    .select(
      `
      ${SUBMISSION_COLUMNS},
      render_form_answers (
        ${ANSWER_COLUMNS}
      )
    `
    )
    .eq("render_account_id", renderAccountId)
    .gte("submitted_at", startIso)
    .lt("submitted_at", endIso)
    .order("submitted_at", { ascending: true });

  if (error) throwQueryError(error);

  return ((data ?? []) as SubmissionQueryRow[]).map(mapSession);
}

/**
 * Pick the latest session for a missionary on the selected day.
 * Multiple submissions are rare; daily review shows the most recent complete session.
 */
function latestSessionForMissionary(
  sessions: LanguageStudySession[],
  missionaryId: string
): LanguageStudySession | null {
  const matched = sessions.filter(
    (session) => session.missionary_id === missionaryId
  );

  if (matched.length === 0) return null;

  return matched.reduce((latest, current) => {
    const latestTime = latest.submitted_at ?? latest.created_at;
    const currentTime = current.submitted_at ?? current.created_at;
    return currentTime > latestTime ? current : latest;
  });
}

/**
 * Build the Language Study Sessions day view for one district + local date.
 * Always includes every missionary in the district, even without a submission.
 */
export async function getLanguageStudyDayView(
  districtId: string,
  dateKey: string
): Promise<LanguageStudyDayView> {
  const [companionships, account] = await Promise.all([
    getCompanionshipsByDistrict(districtId),
    getRenderAccount(),
  ]);

  const missionaries = companionships
    .flatMap((companionship) => companionship.missionaries)
    .sort((a, b) => a.display_name.localeCompare(b.display_name));

  const sessions = account
    ? await getSessionsForDay(account.id, dateKey)
    : [];

  const rows: LanguageStudyMissionaryRow[] = missionaries.map((missionary) => ({
    missionary,
    session: latestSessionForMissionary(sessions, missionary.id),
  }));

  const submittedCount = rows.filter((row) => row.session !== null).length;

  return {
    dateKey,
    missionaries: rows,
    submittedCount,
    missingCount: rows.length - submittedCount,
    totalCount: rows.length,
  };
}
