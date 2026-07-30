import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { type GoogleForm, googleJson } from "./googleForms.ts";
import {
  type NormalizedSubmission,
  processNormalizedSubmission,
} from "./processFormSubmission.ts";

type FormsListResponses = {
  responses?: Array<{
    responseId?: string;
    createTime?: string;
    lastSubmittedTime?: string;
    answers?: Record<
      string,
      {
        questionId?: string;
        textAnswers?: { answers?: Array<{ value?: string }> };
        fileUploadAnswers?: unknown;
      }
    >;
  }>;
};

function answerText(answer: {
  textAnswers?: { answers?: Array<{ value?: string }> };
}): string {
  const values = (answer.textAnswers?.answers ?? [])
    .map((entry) => (entry.value ?? "").trim())
    .filter(Boolean);
  return values.join(", ");
}

/**
 * Pull Google Form responses via Forms API and ingest any new ones.
 * Reliable fallback when Apps Script install/trigger is not working yet.
 */
export async function pullAndIngestFormResponses(
  admin: SupabaseClient,
  accessToken: string,
  params: {
    renderAccountId: string;
    formId: string;
    sheetId: string | null;
  }
): Promise<{ pulled: number; processed: number; duplicates: number }> {
  const form = await googleJson<GoogleForm>(
    accessToken,
    `https://forms.googleapis.com/v1/forms/${params.formId}`,
    { method: "GET" }
  );

  const questionIdToItem: Array<{
    questionId: string;
    itemId: string;
    title: string;
  }> = [];

  for (const item of form.items ?? []) {
    const questionId = item.questionItem?.question?.questionId;
    const itemId = item.itemId;
    if (!questionId || !itemId) continue;
    questionIdToItem.push({
      questionId,
      itemId,
      title: (item.title ?? "").trim(),
    });
  }

  const byQuestionId = new Map(
    questionIdToItem.map((entry) => [entry.questionId, entry])
  );

  const listed = await googleJson<FormsListResponses>(
    accessToken,
    `https://forms.googleapis.com/v1/forms/${params.formId}/responses`,
    { method: "GET" }
  );

  let pulled = 0;
  let processed = 0;
  let duplicates = 0;

  for (const response of listed.responses ?? []) {
    if (!response.responseId) continue;
    pulled += 1;

    const answers: NormalizedSubmission["answers"] = [];
    let whoAreYou = "";

    for (const [questionId, answer] of Object.entries(response.answers ?? {})) {
      const meta = byQuestionId.get(questionId);
      const title = meta?.title ?? "";
      const value = answerText(answer);

      answers.push({
        google_item_id: meta?.itemId ?? null,
        google_question_id: questionId,
        title,
        response: value,
      });

      if (title === "Who are you?") {
        whoAreYou = value;
      }
    }

    const normalized: NormalizedSubmission = {
      render_account_id: params.renderAccountId,
      google_form_id: params.formId,
      google_sheet_id: params.sheetId,
      google_response_id: response.responseId,
      submitted_at:
        response.lastSubmittedTime ?? response.createTime ?? null,
      who_are_you: whoAreYou,
      answers,
      raw_payload: {
        source: "forms_api_pull",
        response,
      },
    };

    const result = await processNormalizedSubmission(admin, normalized);
    if (result.status === "duplicate") {
      duplicates += 1;
    } else if (result.status === "processed" || result.status === "raw_stored") {
      processed += 1;
    }
  }

  console.log(
    JSON.stringify({
      event: "forms_api_pull_complete",
      render_account_id: params.renderAccountId,
      pulled,
      processed,
      duplicates,
    })
  );

  return { pulled, processed, duplicates };
}
