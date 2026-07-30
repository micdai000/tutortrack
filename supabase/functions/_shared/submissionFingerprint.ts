/**
 * Stable fingerprint for a Google Form submission.
 * Used so Apps Script IDs and Forms API responseIds cannot create duplicates.
 */

export type FingerprintAnswer = {
  title: string;
  response: string;
};

function normalizeTimestamp(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.trim();
  }
  // Second precision absorbs minor Apps Script vs Forms API timestamp drift.
  return new Date(Math.floor(date.getTime() / 1000) * 1000).toISOString();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

/** Canonical answer list sorted by title for stable hashing. */
function canonicalizeAnswers(answers: FingerprintAnswer[]): string {
  return answers
    .map((answer) => ({
      title: normalizeText(answer.title).toLowerCase(),
      response: normalizeText(answer.response),
    }))
    .filter((answer) => answer.title.length > 0)
    .sort((a, b) => {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return a.response.localeCompare(b.response);
    })
    .map((answer) => `${answer.title}=${answer.response}`)
    .join("\n");
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

/**
 * Build a duplicate key that is stable across webhook + Forms API pull.
 * Does not include Apps Script / Forms API response ids.
 */
export async function buildSubmissionFingerprint(input: {
  renderAccountId: string;
  googleFormId: string | null | undefined;
  submittedAt: string | null | undefined;
  whoAreYou: string | null | undefined;
  answers: FingerprintAnswer[];
}): Promise<string> {
  const material = [
    normalizeText(input.renderAccountId),
    normalizeText(input.googleFormId),
    normalizeTimestamp(input.submittedAt),
    normalizeText(input.whoAreYou),
    canonicalizeAnswers(input.answers),
  ].join("|");

  return await sha256Hex(material);
}
