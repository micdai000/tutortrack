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

type ResponseType =
  | "YES_NO"
  | "RATING_1_TO_10"
  | "SHORT_TEXT"
  | "PARAGRAPH"
  | "MULTIPLE_CHOICE"
  | "CHECKBOXES";

type RenderQuestionRow = {
  id: string;
  question_text: string;
  helper_text: string | null;
  response_type: ResponseType;
  required: boolean;
  display_order: number;
  options: string[] | null;
};

type GoogleFormCreateResponse = {
  formId?: string;
  responderUri?: string;
  info?: { title?: string };
};

type DriveFileCreateResponse = {
  id?: string;
};

function choiceOptions(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => ({ value }));
}

function buildQuestionRequest(
  question: RenderQuestionRow,
  index: number
): Record<string, unknown> {
  const title = question.question_text.trim() || "Untitled question";
  const description = question.helper_text?.trim() || undefined;
  const required = Boolean(question.required);

  let questionBody: Record<string, unknown>;

  switch (question.response_type) {
    case "SHORT_TEXT":
      questionBody = { required, textQuestion: { paragraph: false } };
      break;
    case "PARAGRAPH":
      questionBody = { required, textQuestion: { paragraph: true } };
      break;
    case "YES_NO":
      questionBody = {
        required,
        choiceQuestion: {
          type: "RADIO",
          options: choiceOptions(["Yes", "No"]),
        },
      };
      break;
    case "RATING_1_TO_10":
      questionBody = {
        required,
        scaleQuestion: {
          low: 1,
          high: 10,
        },
      };
      break;
    case "MULTIPLE_CHOICE": {
      const options = choiceOptions(question.options ?? []);
      if (options.length === 0) {
        throw new Error("QUESTION_OPTIONS_REQUIRED");
      }
      questionBody = {
        required,
        choiceQuestion: { type: "RADIO", options },
      };
      break;
    }
    case "CHECKBOXES": {
      const options = choiceOptions(question.options ?? []);
      if (options.length === 0) {
        throw new Error("QUESTION_OPTIONS_REQUIRED");
      }
      questionBody = {
        required,
        choiceQuestion: { type: "CHECKBOX", options },
      };
      break;
    }
    default:
      throw new Error("UNSUPPORTED_RESPONSE_TYPE");
  }

  const item: Record<string, unknown> = {
    title,
    questionItem: { question: questionBody },
  };

  if (description) {
    item.description = description;
  }

  return {
    createItem: {
      item,
      location: { index },
    },
  };
}

function buildFixedDropdownRequest(
  title: string,
  index: number,
  placeholder: string
): Record<string, unknown> {
  return {
    createItem: {
      item: {
        title,
        description:
          "Managed by TutorTrack. Companionship and missionary choices will be maintained by TutorTrack.",
        questionItem: {
          question: {
            required: true,
            choiceQuestion: {
              type: "DROP_DOWN",
              options: choiceOptions([placeholder]),
            },
          },
        },
      },
      location: { index },
    },
  };
}

async function googleJson<T>(
  accessToken: string,
  url: string,
  init: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(
      `GOOGLE_API_${response.status}:${body.slice(0, 500)}`
    );
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

/**
 * Creates the tutor's permanent Google Form + Responses spreadsheet,
 * populates fixed + custom questions, and stores Google IDs on render_accounts.
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
        "id, user_id, title, google_form_id, google_form_url, google_sheet_id, google_sheet_url, published_at, last_publish_at"
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

    // Duplicate publish — return the permanent form already stored.
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
        },
        200,
        headers
      );
    }

    const { data: questions, error: questionsError } = await admin
      .from("render_questions")
      .select(
        "id, question_text, helper_text, response_type, required, display_order, options"
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

    if (rows.length === 0) {
      return jsonResponse(
        {
          error:
            "Add at least one valid question before publishing to Google Forms.",
        },
        400,
        headers
      );
    }

    for (const question of rows) {
      if (!question.question_text.trim()) {
        return jsonResponse(
          {
            error:
              "Fix validation errors before publishing to Google Forms.",
          },
          400,
          headers
        );
      }

      if (
        (question.response_type === "MULTIPLE_CHOICE" ||
          question.response_type === "CHECKBOXES") &&
        !(question.options ?? []).some((option) => option.trim())
      ) {
        return jsonResponse(
          {
            error:
              "Multiple choice and checkbox questions need at least one option before publishing.",
          },
          400,
          headers
        );
      }
    }

    const tokenResult = await getValidGoogleAccessToken(admin, user.id);
    accessToken = tokenResult.accessToken;

    const formTitle = account.title?.trim() || "Render an Account";

    // 1) Create Google Form
    const createdForm = await googleJson<GoogleFormCreateResponse>(
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

    // 2) Populate fixed + custom questions + confirmation message
    const requests: Record<string, unknown>[] = [
      {
        updateSettings: {
          settings: {
            confirmationMessage:
              "Thank you for submitting your Render an Account.",
          },
          updateMask: "confirmationMessage",
        },
      },
      buildFixedDropdownRequest(
        "Companionship",
        0,
        "(Companionships managed by TutorTrack)"
      ),
      buildFixedDropdownRequest(
        "Missionary",
        1,
        "(Missionaries managed by TutorTrack)"
      ),
    ];

    rows.forEach((question, offset) => {
      requests.push(buildQuestionRequest(question, offset + 2));
    });

    await googleJson(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${createdFormId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({ requests }),
      }
    );

    // Ensure the form accepts responses (newer Forms publish settings).
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
      // Older forms / accounts may not support publish settings — continue.
      console.warn("setPublishSettings skipped:", publishSettingsError);
    }

    const formGet = await googleJson<GoogleFormCreateResponse>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${createdFormId}`,
      { method: "GET" }
    );

    const googleFormUrl =
      formGet.responderUri ||
      `https://docs.google.com/forms/d/${createdFormId}/viewform`;

    // 3) Create permanent Responses spreadsheet (Forms API cannot natively link).
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

    // Seed a header row so the sheet is ready for future response sync.
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
                "Companionship",
                "Missionary",
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

    // 4) Persist IDs only after Google resources succeed.
    const { data: updatedAccount, error: updateError } = await admin
      .from("render_accounts")
      .update({
        google_form_id: createdFormId,
        google_form_url: googleFormUrl,
        google_sheet_id: createdSheetId,
        google_sheet_url: googleSheetUrl,
        published_at: now,
        last_publish_at: now,
        updated_at: now,
      })
      .eq("id", account.id)
      .eq("user_id", user.id)
      .is("google_form_id", null)
      .select(
        "id, google_form_id, google_form_url, google_sheet_id, google_sheet_url, published_at, last_publish_at"
      )
      .maybeSingle();

    if (updateError) {
      console.error("Failed storing Google publish fields:", updateError);
      throw new Error("STORE_FAILED");
    }

    // Race: another publish finished first — roll back this attempt's Google files.
    if (!updatedAccount) {
      await deleteDriveFile(accessToken, createdFormId);
      await deleteDriveFile(accessToken, createdSheetId);
      createdFormId = null;
      createdSheetId = null;

      const { data: existing } = await admin
        .from("render_accounts")
        .select(
          "google_form_id, google_form_url, google_sheet_id, google_sheet_url, published_at, last_publish_at"
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

    return jsonResponse(
      {
        status: "published",
        google_form_id: updatedAccount.google_form_id,
        google_form_url: updatedAccount.google_form_url,
        google_sheet_id: updatedAccount.google_sheet_id,
        google_sheet_url: updatedAccount.google_sheet_url,
        published_at: updatedAccount.published_at,
        last_publish_at: updatedAccount.last_publish_at,
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
        { error: "Connect Google before publishing." },
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

    if (message === "QUESTION_OPTIONS_REQUIRED") {
      return jsonResponse(
        {
          error:
            "Multiple choice and checkbox questions need at least one option before publishing.",
        },
        400,
        headers
      );
    }

    return jsonResponse(
      {
        error: "Unable to publish to Google Forms. Please try again.",
        code: "publish_failed",
      },
      500,
      headers
    );
  }
});
