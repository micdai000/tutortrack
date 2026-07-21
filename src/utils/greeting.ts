import type { User } from "@supabase/supabase-js";

/** Returns Good morning / afternoon / evening based on local time. */
export function getTimeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function readMetadataName(user: User | null): string | null {
  const metadata = user?.user_metadata;
  if (!metadata) return null;

  for (const key of ["full_name", "name"] as const) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

/**
 * Display name for dashboard greeting.
 * Prefers the name saved at sign-up; falls back to email local-part.
 */
export function getDisplayFirstName(user: User | null): string {
  const metadataName = readMetadataName(user);
  if (metadataName) return metadataName;

  const email = user?.email;
  if (email) {
    const localPart = email.split("@")[0];
    if (localPart) return localPart;
  }

  return "Tutor";
}
