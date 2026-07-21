/**
 * Formats last_updated_at for tutors.
 * Examples: "Today at 10:42 AM", "Yesterday", "July 18, 2026"
 */
export function formatLastUpdated(
  isoTimestamp: string,
  now = new Date()
): string {
  const updatedAt = new Date(isoTimestamp);

  if (Number.isNaN(updatedAt.getTime())) {
    return "Unknown";
  }

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfUpdatedDay = new Date(
    updatedAt.getFullYear(),
    updatedAt.getMonth(),
    updatedAt.getDate()
  );
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfUpdatedDay.getTime()) / 86_400_000
  );

  if (dayDiff === 0) {
    return `Today at ${formatTime(updatedAt)}`;
  }

  if (dayDiff === 1) {
    return "Yesterday";
  }

  return updatedAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
