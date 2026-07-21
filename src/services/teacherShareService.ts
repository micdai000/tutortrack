import { supabase } from "../lib/supabase";
import type { TeacherViewData } from "../types/teacherView";
import type {
  SharedTeacherViewMissionary,
  SharedTeacherViewPayload,
  TeacherShareLinkResult,
  TeacherShareType,
} from "../types/teacherShare";
import { getErrorMessage } from "../utils/getErrorMessage";

function throwQueryError(error: unknown): never {
  throw new Error(getErrorMessage(error, "Unexpected database error."));
}

function withSyntheticIds(
  missionaries: SharedTeacherViewMissionary[],
  keyPrefix: string
) {
  return missionaries.map((missionary, index) => ({
    id: `${keyPrefix}-${index}`,
    display_name: missionary.display_name,
    long_term_goal: missionary.long_term_goal,
    short_term_goal: missionary.short_term_goal,
    current_study_plan: missionary.current_study_plan,
  }));
}

/** Map a public share payload into the shared Teacher View document shape. */
export function toSharedTeacherViewData(
  payload: SharedTeacherViewPayload
): TeacherViewData {
  if (payload.share_type === "district") {
    return {
      context: {
        documentTitle: payload.context.documentTitle,
        districtName: payload.context.districtName,
      },
      missionaries: [],
      companionships: (payload.companionships ?? []).map((section, index) => ({
        id: `shared-companionship-${index}`,
        title: section.title,
        memberNames: section.memberNames ?? [],
        missionaries: withSyntheticIds(
          section.missionaries ?? [],
          `shared-companionship-${index}-missionary`
        ),
      })),
      backToPath: "/",
      backLabel: "",
    };
  }

  return {
    context: {
      documentTitle: payload.context.documentTitle,
      districtName: payload.context.districtName,
      scopeLabel: payload.context.scopeLabel ?? "Companionship",
    },
    missionaries: withSyntheticIds(
      payload.missionaries ?? [],
      "shared-missionary"
    ),
    backToPath: "/",
    backLabel: "",
  };
}

/**
 * Get the persistent share token for a resource, creating one only when needed.
 * Ownership is enforced inside the database function.
 */
export async function getOrCreateTeacherShare(
  shareType: TeacherShareType,
  resourceId: string
): Promise<TeacherShareLinkResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to create a share link.");
  }

  const { data, error } = await supabase.rpc("get_or_create_teacher_share", {
    p_share_type: shareType,
    p_resource_id: resourceId,
  });

  if (error) throwQueryError(error);

  const result = data as TeacherShareLinkResult | null;
  if (!result?.token || typeof result.created !== "boolean") {
    throw new Error("Unable to create a share link. Please try again.");
  }

  return {
    token: result.token,
    created: result.created,
  };
}

/**
 * Soft-revoke the active share for a resource (architecture hook for future UI).
 * After revoke, public `/share/:token` stops working until a new link is created.
 */
export async function revokeTeacherShare(
  shareType: TeacherShareType,
  resourceId: string
): Promise<boolean> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to revoke a share link.");
  }

  const { data, error } = await supabase.rpc("revoke_teacher_share", {
    p_share_type: shareType,
    p_resource_id: resourceId,
  });

  if (error) throwQueryError(error);
  return Boolean(data);
}

/** Build the public URL teachers open without signing in. */
export function buildShareUrl(token: string): string {
  return `${window.location.origin}/share/${token}`;
}

/**
 * Resolve a public share token into Teacher View data.
 * Returns null when the token is missing or revoked.
 */
export async function getTeacherViewByShareToken(
  token: string
): Promise<TeacherViewData | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase.rpc("get_teacher_view_by_share_token", {
    p_token: trimmed,
  });

  if (error) throwQueryError(error);
  if (!data) return null;

  return toSharedTeacherViewData(data as SharedTeacherViewPayload);
}
