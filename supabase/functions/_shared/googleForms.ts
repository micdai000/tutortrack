/** Shared Google Forms helpers for publish + sync Edge Functions. */

export type ResponseType =
  | "YES_NO"
  | "RATING_1_TO_10"
  | "SHORT_TEXT"
  | "PARAGRAPH";

export type RenderQuestionRow = {
  id: string;
  question_text: string;
  helper_text: string | null;
  response_type: ResponseType;
  required: boolean;
  display_order: number;
  options: string[] | null;
  google_question_id?: string | null;
};

export type GoogleFormItem = {
  itemId?: string;
  title?: string;
  description?: string;
  questionItem?: {
    question?: {
      questionId?: string;
      required?: boolean;
      textQuestion?: { paragraph?: boolean };
      scaleQuestion?: { low?: number; high?: number };
      choiceQuestion?: {
        type?: string;
        options?: Array<{ value?: string }>;
      };
    };
  };
  pageBreakItem?: Record<string, unknown>;
  textItem?: Record<string, unknown>;
};

export type GoogleForm = {
  formId?: string;
  responderUri?: string;
  revisionId?: string;
  info?: { title?: string };
  items?: GoogleFormItem[];
};

export type BatchUpdateResponse = {
  form?: GoogleForm;
  replies?: Array<{
    createItem?: { itemId?: string; questionId?: string };
  }>;
};

export function choiceOptions(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => ({ value }));
}

export function buildQuestionBody(
  question: Pick<
    RenderQuestionRow,
    "response_type" | "required" | "options"
  >
): Record<string, unknown> {
  const required = Boolean(question.required);

  switch (question.response_type) {
    case "SHORT_TEXT":
      return { required, textQuestion: { paragraph: false } };
    case "PARAGRAPH":
      return { required, textQuestion: { paragraph: true } };
    case "YES_NO":
      return {
        required,
        choiceQuestion: {
          type: "RADIO",
          options: choiceOptions(["Yes", "No"]),
        },
      };
    case "RATING_1_TO_10":
      return {
        required,
        scaleQuestion: { low: 1, high: 10 },
      };
    default:
      throw new Error("UNSUPPORTED_RESPONSE_TYPE");
  }
}

export function buildQuestionItem(
  question: Pick<
    RenderQuestionRow,
    "question_text" | "helper_text" | "response_type" | "required" | "options"
  >,
  itemId?: string
): Record<string, unknown> {
  const title = question.question_text.trim() || "Untitled question";
  const description = question.helper_text?.trim() || "";
  const item: Record<string, unknown> = {
    title,
    description,
    questionItem: {
      question: buildQuestionBody(question),
    },
  };

  if (itemId) {
    item.itemId = itemId;
  }

  return item;
}

export function buildQuestionCreateRequest(
  question: RenderQuestionRow,
  index: number
): Record<string, unknown> {
  return {
    createItem: {
      item: buildQuestionItem(question),
      location: { index },
    },
  };
}

export function buildTextSectionRequest(
  title: string,
  description: string,
  index: number
): Record<string, unknown> {
  return {
    createItem: {
      item: {
        title,
        description,
        textItem: {},
      },
      location: { index },
    },
  };
}

export function buildPageBreakRequest(
  title: string,
  description: string,
  index: number
): Record<string, unknown> {
  return {
    createItem: {
      item: {
        title,
        description,
        pageBreakItem: {},
      },
      location: { index },
    },
  };
}

export function buildFixedDropdownRequest(
  title: string,
  index: number,
  placeholder: string
): Record<string, unknown> {
  return {
    createItem: {
      item: {
        title,
        description:
          "Managed by TutorTrack. Tutors cannot edit or remove this question.",
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

export async function googleJson<T>(
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

export function findSection2StartIndex(items: GoogleFormItem[]): number {
  const byTitle = items.findIndex(
    (item) =>
      Boolean(item.pageBreakItem) &&
      (item.title ?? "").toLowerCase().includes("section 2")
  );
  if (byTitle >= 0) return byTitle;

  return items.findIndex((item) => Boolean(item.pageBreakItem));
}

export function isTutorQuestionItem(item: GoogleFormItem): boolean {
  return Boolean(item.questionItem?.question) && !item.pageBreakItem &&
    !item.textItem;
}

export function isProtectedSystemQuestion(item: GoogleFormItem): boolean {
  const title = (item.title ?? "").trim().toLowerCase();
  if (
    title === "companionship" ||
    title === "missionary" ||
    title === "who are you?"
  ) {
    return true;
  }

  const choice = item.questionItem?.question?.choiceQuestion;
  return choice?.type === "DROP_DOWN";
}

/** Infer TutorTrack response type from a Google Forms item (best effort). */
export function inferResponseType(
  item: GoogleFormItem
): ResponseType | null {
  const question = item.questionItem?.question;
  if (!question) return null;

  if (question.textQuestion) {
    return question.textQuestion.paragraph ? "PARAGRAPH" : "SHORT_TEXT";
  }

  if (question.scaleQuestion) {
    return "RATING_1_TO_10";
  }

  const choice = question.choiceQuestion;
  if (!choice) return null;

  if (choice.type === "DROP_DOWN") return null;

  if (choice.type === "RADIO") {
    const values = (choice.options ?? [])
      .map((option) => (option.value ?? "").trim())
      .filter(Boolean);
    if (values.length === 2 && values[0] === "Yes" && values[1] === "No") {
      return "YES_NO";
    }
  }

  return null;
}

