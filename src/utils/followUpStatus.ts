import { toLocalDateKey } from "./localDate";

/** Follow-up lifecycle states for profile + dashboard. */
export type FollowUpStatusKind = "none" | "scheduled" | "overdue";

export type FollowUpStatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type FollowUpStatus = {
  kind: FollowUpStatusKind;
  /** Badge / status label shown in the Missionary Workspace. */
  label: string;
  tone: FollowUpStatusTone;
  dateKey: string | null;
};

/** Dashboard urgency for active (due/overdue) follow-ups. */
export type ScheduledFollowUpUrgency = "today" | "overdue";

/** Short scheduled label date, e.g. "Aug. 15". */
export function formatFollowUpStatusDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;

  const formatted = new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // "Aug 15" → "Aug. 15"
  return formatted.replace(/^([A-Za-z]+)\s/, "$1. ");
}

/** Full date for dashboard cards, e.g. "August 15, 2026". */
export function formatFollowUpScheduledDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Resolve follow-up status from follow_up_date for the Missionary Workspace. */
export function resolveFollowUpStatus(
  followUpDate: string | null | undefined,
  todayDateKey = toLocalDateKey()
): FollowUpStatus {
  const dateKey = followUpDate?.trim() || null;

  if (!dateKey) {
    return {
      kind: "none",
      label: "No Follow-up Scheduled",
      tone: "neutral",
      dateKey: null,
    };
  }

  if (dateKey < todayDateKey) {
    return {
      kind: "overdue",
      label: `Overdue · ${formatFollowUpStatusDate(dateKey)}`,
      tone: "warning",
      dateKey,
    };
  }

  if (dateKey === todayDateKey) {
    return {
      kind: "scheduled",
      label: "Scheduled for Today",
      tone: "info",
      dateKey,
    };
  }

  return {
    kind: "scheduled",
    label: `Scheduled for ${formatFollowUpStatusDate(dateKey)}`,
    tone: "success",
    dateKey,
  };
}

/** Dashboard badge label/tone for an active scheduled follow-up. */
export function resolveDashboardFollowUpUrgency(
  followUpDate: string,
  todayDateKey = toLocalDateKey()
): {
  urgency: ScheduledFollowUpUrgency;
  label: "Today" | "Overdue";
  tone: "info" | "warning";
} {
  if (followUpDate < todayDateKey) {
    return { urgency: "overdue", label: "Overdue", tone: "warning" };
  }

  return { urgency: "today", label: "Today", tone: "info" };
}

/**
 * Sort active follow-ups: overdue oldest-first, then today's items by name.
 */
export function compareScheduledFollowUps(
  a: { followUpDate: string; missionaryName: string },
  b: { followUpDate: string; missionaryName: string },
  todayDateKey = toLocalDateKey()
): number {
  const aOverdue = a.followUpDate < todayDateKey;
  const bOverdue = b.followUpDate < todayDateKey;

  if (aOverdue !== bOverdue) {
    return aOverdue ? -1 : 1;
  }

  if (aOverdue && bOverdue) {
    const byDate = a.followUpDate.localeCompare(b.followUpDate);
    if (byDate !== 0) return byDate;
  }

  return a.missionaryName.localeCompare(b.missionaryName);
}
