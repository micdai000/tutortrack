import { supabase } from "../lib/supabase";
import { getErrorMessage } from "../utils/getErrorMessage";
import type {
  RenderAccount,
  RenderQuestion,
  RenderQuestionDraft,
  RenderQuestionInput,
  RenderQuestionUpdate,
} from "../types/renderAccount";

/** Convert Supabase/PostgREST plain error objects into real Error instances. */
function throwQueryError(error: unknown): never {
  throw new Error(getErrorMessage(error, "Unexpected database error."));
}

const ACCOUNT_COLUMNS =
  "id, user_id, title, created_at, updated_at, google_form_id, google_form_url, google_sheet_id, google_sheet_url, published_at, last_publish_at, last_synced_at, sync_status, needs_sync, who_are_you_google_question_id, response_pipeline_status, response_pipeline_error, response_pipeline_installed_at, apps_script_project_id";

const QUESTION_COLUMNS =
  "id, render_account_id, display_order, question_text, helper_text, response_type, insight_category, required, options, google_question_id, created_at, updated_at";

/** Mark the Google Form mirror as needing a manual sync (TutorTrack edits pending). */
async function markNeedsSyncIfPublished(
  renderAccountId: string
): Promise<void> {
  const { data: account, error } = await supabase
    .from("render_accounts")
    .select("google_form_id, needs_sync")
    .eq("id", renderAccountId)
    .maybeSingle();

  if (error) throwQueryError(error);
  if (!account?.google_form_id || account.needs_sync) return;

  const { error: updateError } = await supabase
    .from("render_accounts")
    .update({
      needs_sync: true,
      sync_status: "changes_pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", renderAccountId)
    .not("google_form_id", "is", null);

  if (updateError) throwQueryError(updateError);
}

/**
 * Mark the signed-in tutor's published Google Form as Changes Pending.
 * Used when district missionary roster/labels change (Who are you? dropdown).
 */
export async function markRenderAccountNeedsSyncForCurrentUser(): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) return;

  const { data: account, error } = await supabase
    .from("render_accounts")
    .select("id, google_form_id, needs_sync")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) throwQueryError(error);
  if (!account?.google_form_id || account.needs_sync) return;

  await markNeedsSyncIfPublished(account.id);
}

/** True when an update changes fields that are published to Google Forms. */
function updateAffectsGoogleForm(updates: RenderQuestionUpdate): boolean {
  return (
    updates.question_text !== undefined ||
    updates.helper_text !== undefined ||
    updates.response_type !== undefined ||
    updates.required !== undefined ||
    updates.options !== undefined
  );
}

/** Fetch the signed-in tutor's Render an Account (null if none exists). */
export async function getRenderAccount(): Promise<RenderAccount | null> {
  const { data, error } = await supabase
    .from("render_accounts")
    .select(ACCOUNT_COLUMNS)
    .maybeSingle();

  if (error) throwQueryError(error);
  return data;
}

/**
 * Create a Render an Account for the signed-in tutor.
 * Enforced at the database: one account per user.
 */
export async function createRenderAccount(
  title: string
): Promise<RenderAccount> {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new Error("Title is required.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to create a Render an Account.");
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("render_accounts")
    .insert({
      user_id: session.user.id,
      title: trimmedTitle,
      updated_at: now,
    })
    .select(ACCOUNT_COLUMNS)
    .single();

  if (error) {
    // Postgres unique_violation — one account per tutor
    if (error.code === "23505") {
      throw new Error("You already have a Render an Account.");
    }
    throwQueryError(error);
  }

  return data;
}

/** Update the title of the signed-in tutor's Render an Account. */
export async function updateRenderAccount(
  accountId: string,
  title: string
): Promise<RenderAccount> {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new Error("Title is required.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to update a Render an Account.");
  }

  const { data, error } = await supabase
    .from("render_accounts")
    .update({
      title: trimmedTitle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .select(ACCOUNT_COLUMNS)
    .single();

  if (error) throwQueryError(error);
  return data;
}

/** Fetch questions for a Render an Account, ordered by display_order. */
export async function getQuestions(
  renderAccountId: string
): Promise<RenderQuestion[]> {
  const { data, error } = await supabase
    .from("render_questions")
    .select(QUESTION_COLUMNS)
    .eq("render_account_id", renderAccountId)
    .order("display_order", { ascending: true });

  if (error) throwQueryError(error);
  return data ?? [];
}

/** Append a question to a Render an Account. Blank question text is allowed. */
export async function createQuestion(
  renderAccountId: string,
  input: RenderQuestionInput
): Promise<RenderQuestion> {
  const questionText = input.question_text.trim();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to create a question.");
  }

  const { data: existing, error: orderError } = await supabase
    .from("render_questions")
    .select("display_order")
    .eq("render_account_id", renderAccountId)
    .order("display_order", { ascending: false })
    .limit(1);

  if (orderError) throwQueryError(orderError);

  const nextOrder =
    existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("render_questions")
    .insert({
      render_account_id: renderAccountId,
      display_order: nextOrder,
      question_text: questionText,
      helper_text: input.helper_text?.trim() || null,
      response_type: input.response_type,
      insight_category: input.insight_category ?? "NONE",
      required: input.required ?? false,
      options: input.options ?? [],
      updated_at: now,
    })
    .select(QUESTION_COLUMNS)
    .single();

  if (error) throwQueryError(error);

  await markNeedsSyncIfPublished(renderAccountId);
  return data;
}

/** Update editable fields on a question. */
export async function updateQuestion(
  questionId: string,
  updates: RenderQuestionUpdate
): Promise<RenderQuestion> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to update a question.");
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.question_text !== undefined) {
    payload.question_text = updates.question_text.trim();
  }

  if (updates.helper_text !== undefined) {
    payload.helper_text = updates.helper_text.trim() || null;
  }

  if (updates.response_type !== undefined) {
    payload.response_type = updates.response_type;
  }

  if (updates.insight_category !== undefined) {
    payload.insight_category = updates.insight_category;
  }

  if (updates.required !== undefined) {
    payload.required = updates.required;
  }

  if (updates.options !== undefined) {
    payload.options = updates.options;
  }

  const { data, error } = await supabase
    .from("render_questions")
    .update(payload)
    .eq("id", questionId)
    .select(QUESTION_COLUMNS)
    .single();

  if (error) throwQueryError(error);

  if (updateAffectsGoogleForm(updates)) {
    await markNeedsSyncIfPublished(data.render_account_id);
  }

  return data;
}

/** Delete a question by id. */
export async function deleteQuestion(questionId: string): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to delete a question.");
  }

  const { data: existing, error: loadError } = await supabase
    .from("render_questions")
    .select("render_account_id")
    .eq("id", questionId)
    .maybeSingle();

  if (loadError) throwQueryError(loadError);

  const { error } = await supabase
    .from("render_questions")
    .delete()
    .eq("id", questionId);

  if (error) throwQueryError(error);

  if (existing?.render_account_id) {
    await markNeedsSyncIfPublished(existing.render_account_id);
  }
}

/**
 * Reorder questions by applying the given id sequence as display_order 0..n-1.
 * questionIds must be the full ordered list for the account.
 */
export async function reorderQuestions(
  renderAccountId: string,
  questionIds: string[]
): Promise<RenderQuestion[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throwQueryError(sessionError);
  if (!session) {
    throw new Error("You must be signed in to reorder questions.");
  }

  const now = new Date().toISOString();

  for (let i = 0; i < questionIds.length; i += 1) {
    const { error } = await supabase
      .from("render_questions")
      .update({
        display_order: i,
        updated_at: now,
      })
      .eq("id", questionIds[i])
      .eq("render_account_id", renderAccountId);

    if (error) throwQueryError(error);
  }

  await markNeedsSyncIfPublished(renderAccountId);
  return getQuestions(renderAccountId);
}

/** Map a question record into controlled card draft values. */
export function toQuestionDraft(question: RenderQuestion): RenderQuestionDraft {
  return {
    question_text: question.question_text,
    helper_text: question.helper_text ?? "",
    response_type: question.response_type,
    insight_category: question.insight_category,
    required: question.required,
    options: question.options ?? [],
  };
}
