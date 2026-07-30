import {
  corsHeaders,
  jsonResponse,
} from "../_shared/googleOAuth.ts";
import { createServiceClient } from "../_shared/googleTokens.ts";
import { processNormalizedSubmission } from "../_shared/processFormSubmission.ts";

type IncomingAnswer = {
  google_item_id?: unknown;
  title?: unknown;
  response?: unknown;
};

type IncomingPayload = {
  render_account_id?: unknown;
  google_form_id?: unknown;
  google_sheet_id?: unknown;
  google_response_id?: unknown;
  submitted_at?: unknown;
  who_are_you?: unknown;
  answers?: unknown;
};

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeResponseValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(", ");
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Secure webhook for Google Apps Script form submissions.
 * Auth: X-TutorTrack-Webhook-Secret (+ account id header/body).
 */
Deno.serve(async (req) => {
  const headers = {
    ...corsHeaders(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-tutortrack-webhook-secret, x-tutortrack-account-id",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, headers);
  }

  const admin = createServiceClient();

  try {
    let body: IncomingPayload;
    try {
      body = (await req.json()) as IncomingPayload;
    } catch {
      console.warn(JSON.stringify({ event: "validation_failed", reason: "invalid_json" }));
      return jsonResponse({ error: "Malformed JSON payload." }, 400, headers);
    }

    const accountId =
      asString(body.render_account_id) ??
      asString(req.headers.get("X-TutorTrack-Account-Id"));
    const secret = asString(req.headers.get("X-TutorTrack-Webhook-Secret"));

    if (!accountId || !secret) {
      console.warn(
        JSON.stringify({
          event: "validation_failed",
          reason: "missing_auth",
        })
      );
      return jsonResponse({ error: "Unauthorized." }, 401, headers);
    }

    const { data: credentials, error: credentialsError } = await admin
      .from("render_ingestion_credentials")
      .select("webhook_secret, render_account_id")
      .eq("render_account_id", accountId)
      .maybeSingle();

    if (credentialsError) {
      console.error("credentials lookup failed:", credentialsError);
      return jsonResponse({ error: "Unable to authorize request." }, 500, headers);
    }

    if (!credentials || credentials.webhook_secret !== secret) {
      console.warn(
        JSON.stringify({
          event: "validation_failed",
          reason: "invalid_secret",
          render_account_id: accountId,
        })
      );
      return jsonResponse({ error: "Unauthorized." }, 401, headers);
    }

    const googleResponseId = asString(body.google_response_id);
    const answers = Array.isArray(body.answers)
      ? (body.answers as IncomingAnswer[])
      : null;

    if (!googleResponseId || !answers) {
      console.warn(
        JSON.stringify({
          event: "validation_failed",
          reason: "missing_fields",
          render_account_id: accountId,
        })
      );
      return jsonResponse(
        { error: "Payload must include google_response_id and answers." },
        400,
        headers
      );
    }

    console.log(
      JSON.stringify({
        event: "submission_received",
        render_account_id: accountId,
        google_response_id: googleResponseId,
        answer_count: answers.length,
      })
    );

    const result = await processNormalizedSubmission(admin, {
      render_account_id: accountId,
      google_form_id: asString(body.google_form_id),
      google_sheet_id: asString(body.google_sheet_id),
      google_response_id: googleResponseId,
      submitted_at: asString(body.submitted_at),
      who_are_you: asString(body.who_are_you) ?? "",
      answers: answers.map((answer) => ({
        google_item_id: asString(answer.google_item_id),
        title: asString(answer.title) ?? "",
        response: normalizeResponseValue(answer.response),
      })),
      raw_payload: body,
    });

    if (result.status === "raw_stored") {
      return jsonResponse(result, 202, headers);
    }

    return jsonResponse(result, 200, headers);
  } catch (error) {
    console.error("ingest-google-form-response failed:", error);
    return jsonResponse(
      { error: "Unable to ingest submission." },
      500,
      headers
    );
  }
});
