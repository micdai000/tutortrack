import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  corsHeaders,
  jsonResponse,
  requireEnv,
} from "../_shared/googleOAuth.ts";
import {
  createServiceClient,
  deleteDriveFile,
  getValidGoogleAccessToken,
} from "../_shared/googleTokens.ts";
import {
  type BatchUpdateResponse,
  type GoogleForm,
  type RenderQuestionRow,
  buildPageBreakRequest,
  buildQuestionCreateRequest,
  buildTextSectionRequest,
  googleJson,
} from "../_shared/googleForms.ts";
import {
  buildWhoAreYouCreateRequest,
  loadWhoAreYouOptions,
  replaceWhoAreYouOptionMappings,
  whoAreYouChoiceValues,
} from "../_shared/whoAreYou.ts";
import { installResponsePipeline } from "../_shared/appsScriptPipeline.ts";

type DriveFileCreateResponse = {
  id?: string;
};

/**
 * Creates the tutor's permanent Google Form + Responses spreadsheet,
 * populates fixed + custom questions, stores Google IDs, and marks sync up to date.
 */
Deno.serve(async (req) => {
  const headers = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, headers);
  }

  let accessToken: string | null = null;
  let createdFormId: string | null = null;
  let createdSheetId: string | null = null;

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const anonKey = requireEnv("SUPABASE_ANON_KEY");
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

    const admin = createServiceClient();

    const { data: account, error: accountError } = await admin
      .from("render_accounts")
      .select(
        "id, user_id, title, google_form_id, google_form_url, google_sheet_id, google_sheet_url, published_at, last_publish_at, last_synced_at, sync_status, needs_sync, who_are_you_google_question_id"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (accountError) {
      console.error(accountError);
      return jsonResponse(
        { error: "Unable to load Render an Account." },
        500,
        headers
      );
    }

    if (!account) {
      return jsonResponse(
        { error: "Render an Account not found." },
        404,
        headers
      );
    }

    if (account.google_form_id && account.google_form_url) {
      return jsonResponse(
        {
          status: "already_published",
          google_form_id: account.google_form_id,
          google_form_url: account.google_form_url,
          google_sheet_id: account.google_sheet_id,
          google_sheet_url: account.google_sheet_url,
          published_at: account.published_at,
          last_publish_at: account.last_publish_at,
          last_synced_at: account.last_synced_at,
          sync_status: account.sync_status,
          needs_sync: account.needs_sync,
        },
        200,
        headers
      );
    }

    const { data: questions, error: questionsError } = await admin
      .from("render_questions")
      .select(
        "id, question_text, helper_text, response_type, required, display_order, options, google_question_id"
      )
      .eq("render_account_id", account.id)
      .order("display_order", { ascending: true });

    if (questionsError) {
      console.error(questionsError);
      return jsonResponse(
        { error: "Unable to load questions." },
        500,
        headers
      );
    }

    const rows = (questions ?? []) as RenderQuestionRow[];

    for (const question of rows) {
      if (!question.question_text.trim()) {
        return jsonResponse(
          {
            error:
              "Fix validation errors before creating your Google Form.",
          },
          400,
          headers
        );
      }

    }

    const tokenResult = await getValidGoogleAccessToken(admin, user.id);
    accessToken = tokenResult.accessToken;

    const formTitle = account.title?.trim() || "Render an Account";

    const createdForm = await googleJson<{ formId?: string }>(
      accessToken,
      "https://forms.googleapis.com/v1/forms",
      {
        method: "POST",
        body: JSON.stringify({
          info: {
            title: formTitle,
            documentTitle: formTitle,
          },
        }),
      }
    );

    if (!createdForm.formId) {
      throw new Error("FORM_CREATE_FAILED");
    }

    createdFormId = createdForm.formId;

    const whoAreYouOptions = await loadWhoAreYouOptions(admin, user.id);
    const whoAreYouValues = whoAreYouChoiceValues(whoAreYouOptions);

    // Fixed system items occupy request indexes 0–2; tutor questions start at 3.
    const requests: Record<string, unknown>[] = [
      buildTextSectionRequest(
        "Section 1 — TutorTrack-managed questions",
        "These required questions are owned by TutorTrack. Tutors cannot edit or remove them.",
        0
      ),
      buildWhoAreYouCreateRequest(1, whoAreYouValues),
      buildPageBreakRequest(
        "Section 2 — Tutor questions",
        "Questions from your Render an Account.",
        2
      ),
    ];

    rows.forEach((question, offset) => {
      requests.push(buildQuestionCreateRequest(question, offset + 3));
    });

    const batchResult = await googleJson<BatchUpdateResponse>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${createdFormId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({ requests }),
      }
    );

    const whoAreYouItemId =
      batchResult.replies?.[1]?.createItem?.itemId ?? null;

    const questionItemIds: Array<string | null> = rows.map((_, offset) => {
      const reply = batchResult.replies?.[offset + 3];
      return reply?.createItem?.itemId ?? null;
    });

    try {
      await googleJson(
        accessToken,
        `https://forms.googleapis.com/v1/forms/${createdFormId}:setPublishSettings`,
        {
          method: "POST",
          body: JSON.stringify({
            publishSettings: {
              publishState: {
                isPublished: true,
                isAcceptingResponses: true,
              },
            },
          }),
        }
      );
    } catch (publishSettingsError) {
      console.warn("setPublishSettings skipped:", publishSettingsError);
    }

    const formGet = await googleJson<GoogleForm>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${createdFormId}`,
      { method: "GET" }
    );

    const googleFormUrl =
      formGet.responderUri ||
      `https://docs.google.com/forms/d/${createdFormId}/viewform`;

    const sheetTitle = `${formTitle} (Responses)`;
    const createdSheet = await googleJson<DriveFileCreateResponse>(
      accessToken,
      "https://www.googleapis.com/drive/v3/files",
      {
        method: "POST",
        body: JSON.stringify({
          name: sheetTitle,
          mimeType: "application/vnd.google-apps.spreadsheet",
        }),
      }
    );

    if (!createdSheet.id) {
      throw new Error("SHEET_CREATE_FAILED");
    }

    createdSheetId = createdSheet.id;

    try {
      await googleJson(
        accessToken,
        `https://sheets.googleapis.com/v4/spreadsheets/${createdSheetId}/values/Sheet1!A1:append?valueInputOption=RAW`,
        {
          method: "POST",
          body: JSON.stringify({
            values: [
              [
                "Timestamp",
                "Who are you?",
                ...rows.map(
                  (question) =>
                    question.question_text.trim() || "Untitled question"
                ),
              ],
            ],
          }),
        }
      );
    } catch (headerError) {
      console.warn("Unable to seed sheet headers:", headerError);
    }

    const googleSheetUrl =
      `https://docs.google.com/spreadsheets/d/${createdSheetId}/edit`;
    const now = new Date().toISOString();

    await replaceWhoAreYouOptionMappings(admin, account.id, whoAreYouOptions);

    const { data: updatedAccount, error: updateError } = await admin
      .from("render_accounts")
      .update({
        google_form_id: createdFormId,
        google_form_url: googleFormUrl,
        google_sheet_id: createdSheetId,
        google_sheet_url: googleSheetUrl,
        published_at: now,
        last_publish_at: now,
        last_synced_at: now,
        sync_status: "up_to_date",
        needs_sync: false,
        who_are_you_google_question_id: whoAreYouItemId,
        updated_at: now,
      })
      .eq("id", account.id)
      .eq("user_id", user.id)
      .is("google_form_id", null)
      .select(
        "id, google_form_id, google_form_url, google_sheet_id, google_sheet_url, published_at, last_publish_at, last_synced_at, sync_status, needs_sync, who_are_you_google_question_id"
      )
      .maybeSingle();

    if (updateError) {
      console.error("Failed storing Google publish fields:", updateError);
      throw new Error("STORE_FAILED");
    }

    if (!updatedAccount) {
      await deleteDriveFile(accessToken, createdFormId);
      await deleteDriveFile(accessToken, createdSheetId);
      createdFormId = null;
      createdSheetId = null;

      const { data: existing } = await admin
        .from("render_accounts")
        .select(
          "google_form_id, google_form_url, google_sheet_id, google_sheet_url, published_at, last_publish_at, last_synced_at, sync_status, needs_sync"
        )
        .eq("id", account.id)
        .maybeSingle();

      if (existing?.google_form_id) {
        return jsonResponse(
          {
            status: "already_published",
            ...existing,
          },
          200,
          headers
        );
      }

      throw new Error("STORE_FAILED");
    }

    for (let i = 0; i < rows.length; i += 1) {
      const itemId = questionItemIds[i];
      if (!itemId) continue;

      const { error: mapError } = await admin
        .from("render_questions")
        .update({
          google_question_id: itemId,
          updated_at: now,
        })
        .eq("id", rows[i].id)
        .eq("render_account_id", account.id);

      if (mapError) {
        console.error("Failed storing google_question_id:", mapError);
        throw new Error("STORE_FAILED");
      }
    }

    // Stage 3A: install Apps Script On Form Submit → TutorTrack webhook.
    // Publish succeeds even if pipeline install fails (retry on next Sync).
    const pipeline = await installResponsePipeline(admin, accessToken, {
      renderAccountId: account.id,
      formId: createdFormId,
      sheetId: createdSheetId,
    });

    return jsonResponse(
      {
        status: "published",
        ...updatedAccount,
        response_pipeline: pipeline,
      },
      200,
      headers
    );
  } catch (error) {
    console.error("publish-google-form failed:", error);

    if (accessToken) {
      if (createdFormId) {
        await deleteDriveFile(accessToken, createdFormId);
      }
      if (createdSheetId) {
        await deleteDriveFile(accessToken, createdSheetId);
      }
    }

    const message = error instanceof Error ? error.message : "";

    if (message === "NOT_CONNECTED") {
      return jsonResponse(
        { error: "Connect Google before creating your Google Form." },
        400,
        headers
      );
    }

    if (message === "TOKEN_REFRESH_FAILED") {
      return jsonResponse(
        {
          error:
            "Google authorization expired. Disconnect and reconnect Google, then try again.",
          code: "permission_failed",
        },
        401,
        headers
      );
    }

    if (message.includes("GOOGLE_API_403") || message.includes("GOOGLE_API_401")) {
      return jsonResponse(
        {
          error:
            "Google denied permission to create the form. Reconnect Google and grant Forms and Drive access.",
          code: "permission_failed",
        },
        403,
        headers
      );
    }

    if (message.includes("GOOGLE_API_")) {
      return jsonResponse(
        {
          error: "Google could not create the form. Please try again.",
          code: "google_api_failed",
        },
        502,
        headers
      );
    }

    return jsonResponse(
      {
        error: "Unable to create your Google Form. Please try again.",
        code: "publish_failed",
      },
      500,
      headers
    );
  }
});
