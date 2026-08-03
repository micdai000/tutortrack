import { toLocalDateKey } from "./localDate";

/**
 * Follow-up lifecycle states.
 * `overdue` is reserved for a future enhancement — callers should prefer
 * getFollowUpStatusPresentation() for current UI.
 */
export type FollowUpStatusKind = "none" | "scheduled" | "overdue";

export type FollowUpStatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export type FollowUpStatus = {
  kind: FollowUpStatusKind;
  /** Badge / status label shown in the Missionary Workspace. */
  label: string;
  tone: FollowUpStatusTone;
  dateKey: string | null;
};

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

/**
 * Resolve follow-up status from follow_up_date.
 * Past dates resolve to `overdue` for future UI, but presentation currently
 * matches scheduled (no overdue badge yet).
 */
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
      label: `Scheduled for ${formatFollowUpStatusDate(dateKey)}`,
      tone: "success",
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
