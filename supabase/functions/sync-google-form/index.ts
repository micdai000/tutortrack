import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  corsHeaders,
  jsonResponse,
  requireEnv,
} from "../_shared/googleOAuth.ts";
import {
  createServiceClient,
  getValidGoogleAccessToken,
} from "../_shared/googleTokens.ts";
import {
  type BatchUpdateResponse,
  type GoogleForm,
  type GoogleFormItem,
  type RenderQuestionRow,
  buildQuestionCreateRequest,
  buildQuestionItem,
  findSection2StartIndex,
  googleJson,
  inferResponseType,
  isProtectedSystemQuestion,
  isTutorQuestionItem,
} from "../_shared/googleForms.ts";
import {
  loadWhoAreYouOptions,
  replaceWhoAreYouOptionMappings,
  syncWhoAreYouQuestion,
  whoAreYouChoiceValues,
} from "../_shared/whoAreYou.ts";

function section2QuestionEntries(
  items: GoogleFormItem[]
): Array<{ item: GoogleFormItem; index: number }> {
  const section2Start = findSection2StartIndex(items);
  const entries: Array<{ item: GoogleFormItem; index: number }> = [];

  items.forEach((item, index) => {
    if (!item.itemId || !isTutorQuestionItem(item)) return;
    if (isProtectedSystemQuestion(item)) return;
    if (section2Start >= 0 && index <= section2Start) return;
    entries.push({ item, index });
  });

  return entries;
}

function needsContentUpdate(
  question: RenderQuestionRow,
  item: GoogleFormItem
): boolean {
  const title = question.question_text.trim() || "Untitled question";
  const description = question.helper_text?.trim() || "";
  const itemTitle = (item.title ?? "").trim();
  const itemDescription = (item.description ?? "").trim();
  const required = Boolean(item.questionItem?.question?.required);

  if (itemTitle !== title) return true;
  if (itemDescription !== description) return true;
  if (required !== Boolean(question.required)) return true;

  return false;
}

async function getForm(
  accessToken: string,
  formId: string
): Promise<GoogleForm> {
  return googleJson<GoogleForm>(
    accessToken,
    `https://forms.googleapis.com/v1/forms/${formId}`,
    { method: "GET" }
  );
}

async function batchUpdate(
  accessToken: string,
  formId: string,
  requests: Record<string, unknown>[]
): Promise<BatchUpdateResponse> {
  if (requests.length === 0) return {};
  return googleJson<BatchUpdateResponse>(
    accessToken,
    `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
    {
      method: "POST",
      body: JSON.stringify({ requests }),
    }
  );
}

/**
 * Sync TutorTrack questions onto the tutor's existing Google Form.
 * Never creates a second form. Insight categories are never sent to Google.
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
        "id, user_id, google_form_id, google_form_url, google_sheet_id, google_sheet_url, published_at, last_publish_at, last_synced_at, sync_status, needs_sync, who_are_you_google_question_id"
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

    if (!account.google_form_id) {
      return jsonResponse(
        { error: "Create your Google Form before syncing changes." },
        400,
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
            error: "Fix validation errors before syncing to Google Forms.",
          },
          400,
          headers
        );
      }

    }

    const { accessToken } = await getValidGoogleAccessToken(admin, user.id);
    const formId = account.google_form_id as string;

    const whoAreYouOptions = await loadWhoAreYouOptions(admin, user.id);
    const whoAreYouValues = whoAreYouChoiceValues(whoAreYouOptions);

    let form = await getForm(accessToken, formId);

    // Section 1: migrate legacy Companionship/Missionary → Who are you? + refresh options.
    const whoAreYouSync = await syncWhoAreYouQuestion(
      accessToken,
      formId,
      form,
      whoAreYouValues
    );
    form = whoAreYouSync.form;
    let items = form.items ?? [];

    await replaceWhoAreYouOptionMappings(admin, account.id, whoAreYouOptions);

    const { error: whoIdError } = await admin
      .from("render_accounts")
      .update({
        who_are_you_google_question_id: whoAreYouSync.whoAreYouItemId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.id)
      .eq("user_id", user.id);

    if (whoIdError) {
      console.error("Failed storing who_are_you_google_question_id:", whoIdError);
      throw new Error("STORE_FAILED");
    }

    /** TutorTrack question id → Google Forms item id */
    const idMap = new Map<string, string>();
    for (const question of rows) {
      if (question.google_question_id) {
        idMap.set(question.id, question.google_question_id);
      }
    }

    // Backfill missing IDs by Section 2 order (forms published before Stage 2D).
    const section2 = section2QuestionEntries(items);
    const claimed = new Set(idMap.values());
    const unmappedQuestions = rows.filter((question) => !idMap.has(question.id));
    const unmappedGoogle = section2.filter(
      (entry) => entry.item.itemId && !claimed.has(entry.item.itemId)
    );

    unmappedQuestions.forEach((question, offset) => {
      const match = unmappedGoogle[offset];
      if (match?.item.itemId) {
        idMap.set(question.id, match.item.itemId);
        claimed.add(match.item.itemId);
      }
    });

    // 1) Delete orphan Google questions (removed in TutorTrack).
    const keepIds = new Set(idMap.values());
    const orphanIndexes = section2
      .filter((entry) => entry.item.itemId && !keepIds.has(entry.item.itemId))
      .map((entry) => entry.index)
      .sort((a, b) => b - a);

    if (orphanIndexes.length > 0) {
      await batchUpdate(
        accessToken,
        formId,
        orphanIndexes.map((index) => ({
          deleteItem: { location: { index } },
        }))
      );
      form = await getForm(accessToken, formId);
      items = form.items ?? [];
    }

    // 2) Update same-type questions; delete items that need type recreation.
    const recreateIds: string[] = [];
    const updateRequests: Record<string, unknown>[] = [];
    const deleteForRecreate: number[] = [];

    for (const question of rows) {
      const googleId = idMap.get(question.id);
      if (!googleId) {
        recreateIds.push(question.id);
        continue;
      }

      const existingIndex = items.findIndex((item) => item.itemId === googleId);
      const existing = existingIndex >= 0 ? items[existingIndex] : undefined;

      if (!existing) {
        idMap.delete(question.id);
        recreateIds.push(question.id);
        continue;
      }

      const inferred = inferResponseType(existing);
      if (inferred === null || inferred !== question.response_type) {
        deleteForRecreate.push(existingIndex);
        idMap.delete(question.id);
        recreateIds.push(question.id);
        continue;
      }

      if (needsContentUpdate(question, existing)) {
        updateRequests.push({
          updateItem: {
            item: buildQuestionItem(question, existing.itemId),
            location: { index: existingIndex },
            updateMask: "title,description,questionItem",
          },
        });
      }
    }

    if (deleteForRecreate.length > 0) {
      const sortedDeletes = [...new Set(deleteForRecreate)].sort((a, b) => b - a);
      await batchUpdate(
        accessToken,
        formId,
        sortedDeletes.map((index) => ({
          deleteItem: { location: { index } },
        }))
      );
      form = await getForm(accessToken, formId);
      items = form.items ?? [];
    }

    if (updateRequests.length > 0) {
      // Re-resolve indexes after deletes.
      const refreshedUpdates: Record<string, unknown>[] = [];
      for (const question of rows) {
        const googleId = idMap.get(question.id);
        if (!googleId || recreateIds.includes(question.id)) continue;
        const existingIndex = items.findIndex((item) => item.itemId === googleId);
        const existing = existingIndex >= 0 ? items[existingIndex] : undefined;
        if (!existing || !needsContentUpdate(question, existing)) continue;
        refreshedUpdates.push({
          updateItem: {
            item: buildQuestionItem(question, existing.itemId),
            location: { index: existingIndex },
            updateMask: "title,description,questionItem",
          },
        });
      }

      if (refreshedUpdates.length > 0) {
        await batchUpdate(accessToken, formId, refreshedUpdates);
        form = await getForm(accessToken, formId);
        items = form.items ?? [];
      }
    }

    // 3) Create missing / recreated questions.
    const createQuestions = rows.filter((question) =>
      recreateIds.includes(question.id)
    );

    if (createQuestions.length > 0) {
      const createRequests = createQuestions.map((question, offset) =>
        buildQuestionCreateRequest(question, items.length + offset)
      );
      const createResult = await batchUpdate(accessToken, formId, createRequests);

      createQuestions.forEach((question, offset) => {
        const itemId = createResult.replies?.[offset]?.createItem?.itemId;
        if (itemId) {
          idMap.set(question.id, itemId);
        }
      });

      form = await getForm(accessToken, formId);
      items = form.items ?? [];
    }

    // 4) Reorder Section 2 to match TutorTrack display_order.
    const section2Start = findSection2StartIndex(items);
    let baseIndex = section2Start >= 0 ? section2Start + 1 : 0;
    if (section2Start < 0) {
      let lastProtected = -1;
      items.forEach((item, index) => {
        if (isProtectedSystemQuestion(item)) lastProtected = index;
      });
      baseIndex = lastProtected + 1;
    }

    for (let order = 0; order < rows.length; order += 1) {
      const question = rows[order];
      const googleId = idMap.get(question.id);
      if (!googleId) continue;

      form = await getForm(accessToken, formId);
      const currentItems = form.items ?? [];
      const currentIndex = currentItems.findIndex(
        (item) => item.itemId === googleId
      );
      const targetIndex = baseIndex + order;
      if (currentIndex < 0 || currentIndex === targetIndex) continue;

      await batchUpdate(accessToken, formId, [
        {
          moveItem: {
            originalLocation: { index: currentIndex },
            newLocation: { index: targetIndex },
          },
        },
      ]);
    }

    const now = new Date().toISOString();

    for (const question of rows) {
      const googleId = idMap.get(question.id) ?? null;
      const { error: mapError } = await admin
        .from("render_questions")
        .update({
          google_question_id: googleId,
          updated_at: now,
        })
        .eq("id", question.id)
        .eq("render_account_id", account.id);

      if (mapError) {
        console.error("Failed storing google_question_id:", mapError);
        throw new Error("STORE_FAILED");
      }
    }

    const { data: updatedAccount, error: updateError } = await admin
      .from("render_accounts")
      .update({
        needs_sync: false,
        sync_status: "up_to_date",
        last_synced_at: now,
        last_publish_at: now,
        updated_at: now,
      })
      .eq("id", account.id)
      .eq("user_id", user.id)
      .select(
        "id, google_form_id, google_form_url, google_sheet_id, google_sheet_url, published_at, last_publish_at, last_synced_at, sync_status, needs_sync, who_are_you_google_question_id"
      )
      .single();

    if (updateError || !updatedAccount) {
      console.error("Failed storing sync status:", updateError);
      throw new Error("STORE_FAILED");
    }

    return jsonResponse(
      {
        status: "synced",
        ...updatedAccount,
      },
      200,
      headers
    );
  } catch (error) {
    console.error("sync-google-form failed:", error);

    const message = error instanceof Error ? error.message : "";

    if (message === "NOT_CONNECTED") {
      return jsonResponse(
        { error: "Connect Google before syncing changes." },
        400,
        headers
      );
    }

    if (message === "TOKEN_REFRESH_FAILED") {
      return jsonResponse(
        {
          error:
            "Google authorization expired. Reconnect Google, then try Sync Changes again.",
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
            "Google denied permission to update the form. Reconnect Google and try again.",
          code: "permission_failed",
        },
        403,
        headers
      );
    }

    if (message.includes("GOOGLE_API_")) {
      return jsonResponse(
        {
          error: "Google could not sync the form. Please try again.",
          code: "google_api_failed",
        },
        502,
        headers
      );
    }

    return jsonResponse(
      {
        error: "Unable to sync changes to Google Forms. Please try again.",
        code: "sync_failed",
      },
      500,
      headers
    );
  }
});
