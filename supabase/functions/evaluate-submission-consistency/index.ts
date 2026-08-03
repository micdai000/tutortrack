import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  corsHeaders,
  jsonResponse,
  requireEnv,
} from "../_shared/googleOAuth.ts";
import { evaluateAndPersistSubmissionConsistencyForDistrict } from "../_shared/insights/evaluateSubmissionConsistency.ts";

/**
 * Recalculate missed Render an Account (submission consistency) insights
 * for one district owned by the signed-in tutor.
 */
Deno.serve(async (req) => {
  const headers = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, headers);
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const anonKey = requireEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "Not authenticated." }, 401, headers);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Not authenticated." }, 401, headers);
    }

    const body = (await req.json().catch(() => null)) as {
      districtId?: string;
      timeZone?: string;
      todayDateKey?: string;
    } | null;

    const districtId = body?.districtId?.trim();
    if (!districtId) {
      return jsonResponse({ error: "districtId is required." }, 400, headers);
    }

    const { data: district, error: districtError } = await userClient
      .from("districts")
      .select("id")
      .eq("id", districtId)
      .maybeSingle();

    if (districtError) {
      return jsonResponse({ error: districtError.message }, 400, headers);
    }

    if (!district) {
      return jsonResponse({ error: "District not found." }, 404, headers);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const result = await evaluateAndPersistSubmissionConsistencyForDistrict(
      admin,
      districtId,
      {
        timeZone: body?.timeZone,
        todayDateKey: body?.todayDateKey,
      }
    );

    return jsonResponse(
      {
        ok: true,
        districtId,
        evaluatedCount: result.evaluatedCount,
        redCount: result.redCount,
      },
      200,
      headers
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to evaluate submission consistency.";
    console.error(
      JSON.stringify({
        event: "evaluate_submission_consistency_failed",
        error: message,
      })
    );
    return jsonResponse({ error: message }, 500, headers);
  }
});
