import type { User } from "@supabase/supabase-js";

import { getDisplayFirstName } from "./greeting";

/** Two-letter initials for the sidebar avatar. */
export function getUserInitials(user: User | null): string {
  const name = getDisplayFirstName(user).trim();
  if (!name) return "TT";

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const last = parts[1]?.[0] ?? "";
    return `${first}${last}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}
