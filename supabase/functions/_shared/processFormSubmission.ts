import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { evaluateAndPersistMissionaryInsights } from "./insights/evaluateMissionaryInsights.ts";

export type NormalizedAnswer = {
  google_item_id?: string | null;
  google_question_id?: string | null;
  title: string;
  response: string;
};

export type NormalizedSubmission = {
  render_account_id: string;
  google_form_id?: string | null;
  google_sheet_id?: string | null;
  google_response_id: string;
  submitted_at?: string | null;
  who_are_you: string;
  answers: NormalizedAnswer[];
  raw_payload: unknown;
};

type QuestionRow = {
  id: string;
  question_text: string;
  response_type: string;
  insight_category: string;
  google_question_id: string | null;
};

export type ProcessSubmissionResult =
  | { status: "duplicate"; raw_submission_id: string }
  | {
      status: "processed";
      raw_submission_id: string;
      submission_id: string;
      match_status: "matched" | "unmatched";
    }
  | {
      status: "raw_stored";
      raw_submission_id: string;
      warning: string;
    };

/**
 * Store immutable raw payload, then create structured TutorTrack records.
 * Safe to call from webhook ingest or Forms API pull.
 */
export async function processNormalizedSubmission(
  admin: SupabaseClient,
  submission: NormalizedSubmission
): Promise<ProcessSubmissionResult> {
  const accountId = submission.render_account_id;

  const { data: account, error: accountError } = await admin
    .from("render_accounts")
    .select(
      "id, google_form_id, google_sheet_id, who_are_you_google_question_id"
    )
    .eq("id", accountId)
    .maybeSingle();

  if (accountError || !account) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  const { data: existingRaw } = await admin
    .from("render_form_submissions_raw")
    .select("id, process_status")
    .eq("render_account_id", accountId)
    .eq("google_response_id", submission.google_response_id)
    .maybeSingle();

  if (existingRaw) {
    return {
      status: "duplicate",
      raw_submission_id: existingRaw.id as string,
    };
  }

  const { data: rawRow, error: rawError } = await admin
    .from("render_form_submissions_raw")
    .insert({
      render_account_id: accountId,
      google_form_id:
        submission.google_form_id ?? (account.google_form_id as string | null),
      google_sheet_id:
        submission.google_sheet_id ?? (account.google_sheet_id as string | null),
      google_response_id: submission.google_response_id,
      submitted_at: submission.submitted_at,
      payload: submission.raw_payload,
      process_status: "pending",
    })
    .select("id")
    .single();

  if (rawError || !rawRow) {
    throw new Error(`RAW_INSERT_FAILED:${rawError?.message ?? "unknown"}`);
  }

  const rawId = rawRow.id as string;
  const whoAreYou = submission.who_are_you.trim();

  try {
    let missionaryId: string | null = null;
    let matchStatus: "matched" | "unmatched" = "unmatched";
    let matchMethod: "option_label" | "none" = "none";

    if (whoAreYou) {
      const { data: optionMatch, error: optionError } = await admin
        .from("render_who_are_you_options")
        .select("missionary_id")
        .eq("render_account_id", accountId)
        .eq("option_label", whoAreYou)
        .maybeSingle();

      if (optionError) {
        throw new Error(`WHO_ARE_YOU_LOOKUP_FAILED:${optionError.message}`);
      }

      if (optionMatch?.missionary_id) {
        missionaryId = optionMatch.missionary_id as string;
        matchStatus = "matched";
        matchMethod = "option_label";
      }
    }

    console.log(
      JSON.stringify({
        event: "missionary_matched",
        render_account_id: accountId,
        raw_submission_id: rawId,
        match_status: matchStatus,
        match_method: matchMethod,
        missionary_id: missionaryId,
      })
    );

    const { data: questions, error: questionsError } = await admin
      .from("render_questions")
      .select(
        "id, question_text, response_type, insight_category, google_question_id"
      )
      .eq("render_account_id", accountId);

    if (questionsError) {
      throw new Error(`QUESTIONS_LOAD_FAILED:${questionsError.message}`);
    }

    const questionRows = (questions ?? []) as QuestionRow[];
    const byGoogleId = new Map(
      questionRows
        .filter((question) => question.google_question_id)
        .map((question) => [question.google_question_id as string, question])
    );
    const byTitle = new Map(
      questionRows.map((question) => [
        question.question_text.trim().toLowerCase(),
        question,
      ])
    );

    const { data: structured, error: submissionError } = await admin
      .from("render_form_submissions")
      .insert({
        render_account_id: accountId,
        raw_submission_id: rawId,
        missionary_id: missionaryId,
        who_are_you_label: whoAreYou || null,
        match_status: matchStatus,
        match_method: matchMethod,
        submitted_at: submission.submitted_at,
      })
      .select("id")
      .single();

    if (submissionError || !structured) {
      throw new Error(
        `STRUCTURED_HEADER_FAILED:${submissionError?.message ?? "unknown"}`
      );
    }

    const whoAreYouGoogleId = account.who_are_you_google_question_id as
      | string
      | null;

    const answerRows = submission.answers
      .map((answer) => {
        const title = answer.title.trim();
        const googleItemId =
          answer.google_item_id?.trim() ||
          answer.google_question_id?.trim() ||
          null;

        if (
          title === "Who are you?" ||
          (whoAreYouGoogleId && googleItemId === whoAreYouGoogleId)
        ) {
          return null;
        }

        const matched =
          (googleItemId ? byGoogleId.get(googleItemId) : undefined) ??
          byTitle.get(title.toLowerCase());

        return {
          submission_id: structured.id,
          render_question_id: matched?.id ?? null,
          google_question_id: googleItemId,
          question_text: title || matched?.question_text || "Untitled question",
          response_type: matched?.response_type ?? null,
          insight_category: matched?.insight_category ?? null,
          response_value: answer.response,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (answerRows.length > 0) {
      const { error: answersError } = await admin
        .from("render_form_answers")
        .insert(answerRows);

      if (answersError) {
        throw new Error(`ANSWERS_INSERT_FAILED:${answersError.message}`);
      }
    }

    await admin
      .from("render_form_submissions_raw")
      .update({
        process_status: "processed",
        process_error: null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", rawId);

    console.log(
      JSON.stringify({
        event: "structured_response_created",
        render_account_id: accountId,
        raw_submission_id: rawId,
        submission_id: structured.id,
        answer_count: answerRows.length,
        match_status: matchStatus,
      })
    );

    // Stage 3C: recalculate insights only for the missionary who just submitted.
    // Failures are logged and never discard the stored Language Study Session.
    if (matchStatus === "matched" && missionaryId) {
      try {
        await evaluateAndPersistMissionaryInsights(admin, missionaryId);
      } catch (insightError) {
        const insightMessage =
          insightError instanceof Error
            ? insightError.message
            : "Missionary insights evaluation failed.";

        console.error(
          JSON.stringify({
            event: "missionary_insights_evaluation_failed",
            render_account_id: accountId,
            submission_id: structured.id,
            missionary_id: missionaryId,
            error: insightMessage,
          })
        );
      }
    }

    return {
      status: "processed",
      raw_submission_id: rawId,
      submission_id: structured.id as string,
      match_status: matchStatus,
    };
  } catch (structureError) {
    const message =
      structureError instanceof Error
        ? structureError.message
        : "Structured processing failed.";

    console.error(
      JSON.stringify({
        event: "structured_processing_failed",
        render_account_id: accountId,
        raw_submission_id: rawId,
        error: message,
      })
    );

    await admin
      .from("render_form_submissions_raw")
      .update({
        process_status: "failed",
        process_error: message.slice(0, 1000),
        processed_at: new Date().toISOString(),
      })
      .eq("id", rawId);

    return {
      status: "raw_stored",
      raw_submission_id: rawId,
      warning: "Structured processing failed; raw payload preserved.",
    };
  }
}
