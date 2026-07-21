import type { User } from "@supabase/supabase-js";

/** Returns Good morning / afternoon / evening based on local time. */
export function getTimeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Prefers full name from user metadata; falls back to email local-part. */
export function getDisplayFirstName(user: User | null): string {
  const fullName = user?.user_metadata?.full_name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? "Tutor";
  }

  const email = user?.email;
  if (email) {
    const localPart = email.split("@")[0];
    if (localPart) return localPart;
  }

  return "Tutor";
}
