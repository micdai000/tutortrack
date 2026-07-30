/**
 * Local calendar helpers for Language Study Sessions filters.
 * Day bounds use the tutor's browser timezone so "Today" matches wall-clock day.
 */

/** Format a Date as YYYY-MM-DD in local time. */
export function toLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Inclusive start / exclusive end ISO bounds for a local YYYY-MM-DD day. */
export function getLocalDayBounds(dateKey: string): {
  startIso: string;
  endIso: string;
} {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    const today = toLocalDateKey();
    return getLocalDayBounds(today);
  }

  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

/** True when dateKey is the tutor's local calendar today. */
export function isLocalToday(dateKey: string, now = new Date()): boolean {
  return dateKey === toLocalDateKey(now);
}

/** Display label for a YYYY-MM-DD local date (e.g. "July 29, 2026"). */
export function formatLocalDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Submission time for collapsed cards (e.g. "2:07 PM"). */
export function formatSubmissionTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
