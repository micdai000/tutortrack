import { supabase } from "../lib/supabase";
import type { District } from "../types/district";
import { getErrorMessage } from "../utils/getErrorMessage";

/** Convert Supabase/PostgREST plain error objects into real Error instances. */
function throwQueryError(error: unknown): never {
  throw new Error(getErrorMessage(error, "Unexpected database error."));
}

/** Fetch districts for the signed-in user (RLS enforces ownership). */
export async function getDistricts(): Promise<District[]> {
  const { data, error } = await supabase
    .from("districts")
    .select("id, user_id, name, created_at")
    .order("name", { ascending: true });

  if (error) throwQueryError(error);
  return data ?? [];
}

/**
 * Create a district for the signed-in tutor.
 * user_id is set by the database default auth.uid() so it always
 * matches the RLS insert policy.
 */
export async function createDistrict(name: string): Promise<District> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("District name is required.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to create a district.");
  }

  // user_id must match auth.uid() from the request JWT (RLS WITH CHECK).
  const { data, error } = await supabase
    .from("districts")
    .insert({
      user_id: session.user.id,
      name: trimmedName,
    })
    .select("id, user_id, name, created_at")
    .single();

  if (error) {
    // Postgres unique_violation
    if (error.code === "23505") {
      throw new Error("You already have a district with this name.");
    }
    throwQueryError(error);
  }

  return data;
}
