import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import {
  type BatchUpdateResponse,
  type GoogleForm,
  type GoogleFormItem,
  buildPageBreakRequest,
  buildTextSectionRequest,
  choiceOptions,
  googleJson,
} from "./googleForms.ts";

export const WHO_ARE_YOU_TITLE = "Who are you?";
export const WHO_ARE_YOU_DESCRIPTION =
  "Managed by TutorTrack. Tutors cannot edit or remove this question.";
export const WHO_ARE_YOU_EMPTY_OPTION =
  "(No missionaries in your districts yet)";

export type WhoAreYouOption = {
  missionaryId: string;
  displayName: string;
  companionshipId: string;
  optionLabel: string;
};

export function formatCompanionshipLabel(displayNames: string[]): string {
  const names = displayNames.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return "Companionship";
  return names.join(" · ");
}

export function formatWhoAreYouOptionLabel(
  displayName: string,
  companionshipLabel: string
): string {
  return `${displayName.trim()} — ${companionshipLabel.trim()}`;
}

export function isWhoAreYouQuestion(item: GoogleFormItem): boolean {
  return (item.title ?? "").trim().toLowerCase() === "who are you?";
}

export function isLegacyManagedQuestion(item: GoogleFormItem): boolean {
  const title = (item.title ?? "").trim().toLowerCase();
  return title === "companionship" || title === "missionary";
}

/** Load dropdown options for every missionary in the tutor's districts. */
export async function loadWhoAreYouOptions(
  admin: SupabaseClient,
  userId: string
): Promise<WhoAreYouOption[]> {
  const { data: districts, error: districtError } = await admin
    .from("districts")
    .select("id")
    .eq("user_id", userId);

  if (districtError) {
    throw new Error(`Unable to load districts: ${districtError.message}`);
  }

  const districtIds = (districts ?? []).map((row) => row.id as string);
  if (districtIds.length === 0) return [];

  const { data: companionships, error: companionshipError } = await admin
    .from("companionships")
    .select(
      `
      id,
      missionaries (
        id,
        display_name,
        companionship_id
      )
    `
    )
    .in("district_id", districtIds);

  if (companionshipError) {
    throw new Error(
      `Unable to load companionships: ${companionshipError.message}`
    );
  }

  const options: WhoAreYouOption[] = [];

  for (const companionship of companionships ?? []) {
    const members = (companionship.missionaries ?? []) as Array<{
      id: string;
      display_name: string;
      companionship_id: string;
    }>;
    const companionshipLabel = formatCompanionshipLabel(
      members.map((member) => member.display_name)
    );

    for (const missionary of members) {
      const displayName = missionary.display_name.trim();
      if (!displayName) continue;

      options.push({
        missionaryId: missionary.id,
        displayName,
        companionshipId: companionship.id as string,
        optionLabel: formatWhoAreYouOptionLabel(
          displayName,
          companionshipLabel
        ),
      });
    }
  }

  options.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    })
  );

  return options;
}

export function whoAreYouChoiceValues(options: WhoAreYouOption[]): string[] {
  if (options.length === 0) return [WHO_ARE_YOU_EMPTY_OPTION];
  return options.map((option) => option.optionLabel);
}

export function buildWhoAreYouCreateRequest(
  index: number,
  optionValues: string[]
): Record<string, unknown> {
  return {
    createItem: {
      item: {
        title: WHO_ARE_YOU_TITLE,
        description: WHO_ARE_YOU_DESCRIPTION,
        questionItem: {
          question: {
            required: true,
            choiceQuestion: {
              type: "DROP_DOWN",
              options: choiceOptions(optionValues),
            },
          },
        },
      },
      location: { index },
    },
  };
}

export function buildWhoAreYouUpdateRequest(
  itemId: string,
  index: number,
  optionValues: string[]
): Record<string, unknown> {
  return {
    updateItem: {
      item: {
        itemId,
        title: WHO_ARE_YOU_TITLE,
        description: WHO_ARE_YOU_DESCRIPTION,
        questionItem: {
          question: {
            required: true,
            choiceQuestion: {
              type: "DROP_DOWN",
              options: choiceOptions(optionValues),
            },
          },
        },
      },
      location: { index },
      updateMask: "title,description,questionItem",
    },
  };
}

/** Persist missionary_id → exact Google option_label for Stage 3 ingestion. */
export async function replaceWhoAreYouOptionMappings(
  admin: SupabaseClient,
  renderAccountId: string,
  options: WhoAreYouOption[]
): Promise<void> {
  const now = new Date().toISOString();

  const { error: deleteError } = await admin
    .from("render_who_are_you_options")
    .delete()
    .eq("render_account_id", renderAccountId);

  if (deleteError) {
    throw new Error(`Unable to clear Who are you? mappings: ${deleteError.message}`);
  }

  if (options.length === 0) return;

  const { error: insertError } = await admin
    .from("render_who_are_you_options")
    .insert(
      options.map((option) => ({
        render_account_id: renderAccountId,
        missionary_id: option.missionaryId,
        option_label: option.optionLabel,
        updated_at: now,
      }))
    );

  if (insertError) {
    throw new Error(
      `Unable to store Who are you? mappings: ${insertError.message}`
    );
  }
}

type SyncWhoAreYouResult = {
  form: GoogleForm;
  whoAreYouItemId: string | null;
};

/**
 * Ensure Section 1 has a single Who are you? dropdown with current options.
 * Removes legacy Companionship / Missionary questions when present.
 */
export async function syncWhoAreYouQuestion(
  accessToken: string,
  formId: string,
  form: GoogleForm,
  optionValues: string[]
): Promise<SyncWhoAreYouResult> {
  let items = form.items ?? [];

  // Delete legacy managed questions (high index → low).
  const legacyIndexes = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isLegacyManagedQuestion(item))
    .map(({ index }) => index)
    .sort((a, b) => b - a);

  if (legacyIndexes.length > 0) {
    await googleJson<BatchUpdateResponse>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          requests: legacyIndexes.map((index) => ({
            deleteItem: { location: { index } },
          })),
        }),
      }
    );

    form = await googleJson<GoogleForm>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${formId}`,
      { method: "GET" }
    );
    items = form.items ?? [];
  }

  let whoIndex = items.findIndex((item) => isWhoAreYouQuestion(item));
  let whoItemId = whoIndex >= 0 ? items[whoIndex]?.itemId ?? null : null;

  if (whoIndex >= 0 && whoItemId) {
    await googleJson<BatchUpdateResponse>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          requests: [
            buildWhoAreYouUpdateRequest(whoItemId, whoIndex, optionValues),
          ],
        }),
      }
    );
  } else {
    // Insert after Section 1 text item when present; otherwise at index 0.
    const sectionTextIndex = items.findIndex(
      (item) =>
        Boolean(item.textItem) &&
        (item.title ?? "").toLowerCase().includes("section 1")
    );
    const insertIndex = sectionTextIndex >= 0 ? sectionTextIndex + 1 : 0;

    const createResult = await googleJson<BatchUpdateResponse>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          requests: [buildWhoAreYouCreateRequest(insertIndex, optionValues)],
        }),
      }
    );

    whoItemId = createResult.replies?.[0]?.createItem?.itemId ?? null;
  }

  form = await googleJson<GoogleForm>(
    accessToken,
    `https://forms.googleapis.com/v1/forms/${formId}`,
    { method: "GET" }
  );

  // Ensure a Section 2 page break exists after Who are you? for tutor questions.
  items = form.items ?? [];
  whoIndex = items.findIndex((item) => isWhoAreYouQuestion(item));
  const hasSection2Break = items.some(
    (item) =>
      Boolean(item.pageBreakItem) &&
      (item.title ?? "").toLowerCase().includes("section 2")
  );

  if (whoIndex >= 0 && !hasSection2Break) {
    await googleJson<BatchUpdateResponse>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          requests: [
            buildPageBreakRequest(
              "Section 2 — Tutor questions",
              "Questions from your Render an Account.",
              whoIndex + 1
            ),
          ],
        }),
      }
    );

    form = await googleJson<GoogleForm>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${formId}`,
      { method: "GET" }
    );
  }

  // Ensure Section 1 header text exists.
  items = form.items ?? [];
  const hasSection1Text = items.some(
    (item) =>
      Boolean(item.textItem) &&
      (item.title ?? "").toLowerCase().includes("section 1")
  );

  if (!hasSection1Text) {
    await googleJson<BatchUpdateResponse>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          requests: [
            buildTextSectionRequest(
              "Section 1 — TutorTrack-managed questions",
              "These required questions are owned by TutorTrack. Tutors cannot edit or remove them.",
              0
            ),
          ],
        }),
      }
    );

    form = await googleJson<GoogleForm>(
      accessToken,
      `https://forms.googleapis.com/v1/forms/${formId}`,
      { method: "GET" }
    );
  }

  const finalWho = (form.items ?? []).find((item) => isWhoAreYouQuestion(item));

  return {
    form,
    whoAreYouItemId: finalWho?.itemId ?? whoItemId,
  };
}
