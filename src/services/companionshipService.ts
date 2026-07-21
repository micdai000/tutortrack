import { supabase } from "../lib/supabase";
import type { CompanionshipWithMissionaries } from "../types/companionship";
import type { District } from "../types/district";
import type { Missionary } from "../types/missionary";
import type {
  TeacherViewCompanionshipSection,
  TeacherViewData,
  TeacherViewMissionary,
} from "../types/teacherView";
import { getErrorMessage } from "../utils/getErrorMessage";
import { getDistrictById } from "./districtService";

function throwQueryError(error: unknown): never {
  throw new Error(getErrorMessage(error, "Unexpected database error."));
}

type MissionaryRow = Missionary & {
  long_term_goal: string | null;
  short_term_goal: string | null;
  current_study_plan: string | null;
};

type CompanionshipQueryRow = {
  id: string;
  district_id: string;
  created_at: string;
  missionaries: MissionaryRow[] | null;
};

type CompanionshipDetailQueryRow = CompanionshipQueryRow & {
  districts: District | District[] | null;
};

export type CompanionshipWorkspaceData = CompanionshipWithMissionaries & {
  district: District;
  missionaries: MissionaryRow[];
};

export type DistrictTeacherViewSource = {
  district: District;
  companionships: Array<
    CompanionshipWithMissionaries & { missionaries: MissionaryRow[] }
  >;
};

const TEACHER_VIEW_MISSIONARY_COLUMNS = `
  id,
  companionship_id,
  display_name,
  long_term_goal,
  short_term_goal,
  current_study_plan,
  created_at
`;

function mapMissionaries(rows: MissionaryRow[] | null): MissionaryRow[] {
  return [...(rows ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
}

function mapCompanionshipRow(
  row: CompanionshipQueryRow
): CompanionshipWithMissionaries & { missionaries: MissionaryRow[] } {
  return {
    id: row.id,
    district_id: row.district_id,
    created_at: row.created_at,
    missionaries: mapMissionaries(row.missionaries),
  };
}

function toTeacherMissionary(row: MissionaryRow): TeacherViewMissionary {
  return {
    id: row.id,
    display_name: row.display_name,
    long_term_goal: row.long_term_goal,
    short_term_goal: row.short_term_goal,
    current_study_plan: row.current_study_plan,
  };
}

function toCompanionshipSection(
  companionship: CompanionshipWithMissionaries & {
    missionaries: MissionaryRow[];
  }
): TeacherViewCompanionshipSection {
  return {
    id: companionship.id,
    title: "Companionship",
    memberNames: companionship.missionaries.map(
      (missionary) => missionary.display_name
    ),
    missionaries: companionship.missionaries.map(toTeacherMissionary),
  };
}

/** Load companionships and their missionaries for a district. */
export async function getCompanionshipsByDistrict(
  districtId: string
): Promise<CompanionshipWithMissionaries[]> {
  const { data, error } = await supabase
    .from("companionships")
    .select(
      `
      id,
      district_id,
      created_at,
      missionaries (
        id,
        companionship_id,
        display_name,
        created_at
      )
    `
    )
    .eq("district_id", districtId)
    .order("created_at", { ascending: true });

  if (error) throwQueryError(error);

  const rows = (data ?? []) as CompanionshipQueryRow[];
  return rows.map(mapCompanionshipRow);
}

/** Load one companionship with missionaries and its parent district. */
export async function getCompanionshipById(
  companionshipId: string
): Promise<CompanionshipWorkspaceData | null> {
  const { data, error } = await supabase
    .from("companionships")
    .select(
      `
      id,
      district_id,
      created_at,
      missionaries (
        ${TEACHER_VIEW_MISSIONARY_COLUMNS}
      ),
      districts (
        id,
        user_id,
        name,
        created_at
      )
    `
    )
    .eq("id", companionshipId)
    .maybeSingle();

  if (error) throwQueryError(error);
  if (!data) return null;

  const row = data as CompanionshipDetailQueryRow;
  const district = Array.isArray(row.districts)
    ? (row.districts[0] ?? null)
    : row.districts;

  if (!district) return null;

  return {
    ...mapCompanionshipRow(row),
    district,
  };
}

/**
 * Load a district and all companionship study plans for Teacher View.
 * Keeps list queries lean by using a dedicated teacher-view select.
 */
export async function getDistrictTeacherViewSource(
  districtId: string
): Promise<DistrictTeacherViewSource | null> {
  const district = await getDistrictById(districtId);
  if (!district) return null;

  const { data, error } = await supabase
    .from("companionships")
    .select(
      `
      id,
      district_id,
      created_at,
      missionaries (
        ${TEACHER_VIEW_MISSIONARY_COLUMNS}
      )
    `
    )
    .eq("district_id", districtId)
    .order("created_at", { ascending: true });

  if (error) throwQueryError(error);

  const rows = (data ?? []) as CompanionshipQueryRow[];

  return {
    district,
    companionships: rows.map(mapCompanionshipRow),
  };
}

/** Map a companionship workspace into Teacher View presentation data. */
export function toCompanionshipTeacherView(
  workspace: CompanionshipWorkspaceData
): TeacherViewData {
  return {
    context: {
      documentTitle: "Language Study Plans",
      districtName: workspace.district.name,
      scopeLabel: "Companionship",
    },
    missionaries: workspace.missionaries.map(toTeacherMissionary),
    backToPath: `/companionships/${workspace.id}`,
    backLabel: "← Back to companionship",
  };
}

/** Map a district + companionships into Teacher View presentation data. */
export function toDistrictTeacherView(
  source: DistrictTeacherViewSource
): TeacherViewData {
  return {
    context: {
      documentTitle: "Language Study Plans",
      districtName: source.district.name,
    },
    missionaries: [],
    companionships: source.companionships.map(toCompanionshipSection),
    backToPath: `/districts/${source.district.id}`,
    backLabel: "← Back to district",
  };
}

/**
 * Create a companionship and its missionaries via a secure DB function.
 * The function verifies district ownership, then inserts related rows.
 */
export async function createCompanionshipWithMissionaries(
  districtId: string,
  missionaryNames: string[]
): Promise<CompanionshipWithMissionaries> {
  const names = missionaryNames.map((name) => name.trim()).filter(Boolean);

  if (names.length < 2 || names.length > 3) {
    throw new Error("A companionship must have 2 or 3 missionaries.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to create a companionship.");
  }

  const { data, error } = await supabase.rpc(
    "create_companionship_with_missionaries",
    {
      p_district_id: districtId,
      p_names: names,
    }
  );

  if (error) throwQueryError(error);

  return data as CompanionshipWithMissionaries;
}

/** Delete a companionship. Missionaries cascade via ON DELETE CASCADE. */
export async function deleteCompanionship(
  companionshipId: string
): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to delete a companionship.");
  }

  const { error } = await supabase
    .from("companionships")
    .delete()
    .eq("id", companionshipId);

  if (error) throwQueryError(error);
}
