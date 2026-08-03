import { supabase } from "../lib/supabase";
import { getErrorMessage } from "../utils/getErrorMessage";
import { toLocalDateKey } from "../utils/localDate";

/** Recalculate missed Render an Account flags for one district. */
export async function refreshSubmissionConsistencyForDistrict(
  districtId: string
): Promise<void> {
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver";

  const { error } = await supabase.functions.invoke(
    "evaluate-submission-consistency",
    {
      body: {
        districtId,
        timeZone,
        todayDateKey: toLocalDateKey(),
      },
    }
  );

  if (error) {
    throw new Error(
      getErrorMessage(error, "Unable to refresh submission consistency.")
    );
  }
}
