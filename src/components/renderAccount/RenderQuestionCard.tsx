import { useEffect, useRef, useState } from "react";

import { AutoSaveBadge } from "../missionary/AutoSaveBadge";
import { Button, Checkbox, Field, Select, Textarea, cx } from "../ui";
import { toQuestionDraft } from "../../services/renderAccountService";
import type { MissionarySaveStatus } from "../../types/missionary";
import type {
  InsightCategory,
  RenderQuestion,
  RenderQuestionDraft,
  RenderQuestionUpdate,
  ResponseType,
} from "../../types/renderAccount";
import {
  INSIGHT_CATEGORY_LABELS,
  INSIGHT_CATEGORY_OPTIONS,
  RESPONSE_TYPE_LABELS,
  RESPONSE_TYPE_OPTIONS,
} from "../../types/renderAccount";
import {
  isInsightCategoryAllowed,
  resolveInsightCategoryForResponseType,
} from "../../utils/renderAccountInsightRules";
import type { RenderQuestionFieldErrors } from "../../utils/renderAccountValidation";
import { getErrorMessage } from "../../utils/getErrorMessage";

const AUTO_SAVE_DELAY_MS = 1000;

type RenderQuestionCardProps = {
  question: RenderQuestion;
  questionNumber: number;
  autoFocus?: boolean;
  fieldErrors?: RenderQuestionFieldErrors;
  onSave: (
    questionId: string,
    updates: RenderQuestionUpdate
  ) => Promise<RenderQuestion>;
  onDraftChange: (questionId: string, draft: RenderQuestionDraft) => void;
  onRequestDelete: (question: RenderQuestion) => void;
};

function draftsEqual(a: RenderQuestionDraft, b: RenderQuestionDraft): boolean {
  return (
    a.question_text === b.question_text &&
    a.helper_text === b.helper_text &&
    a.response_type === b.response_type &&
    a.insight_category === b.insight_category &&
    a.required === b.required
  );
}

function buildDraft(question: RenderQuestion): RenderQuestionDraft {
  const draft = toQuestionDraft(question);
  return {
    ...draft,
    insight_category: resolveInsightCategoryForResponseType(
      draft.response_type,
      draft.insight_category
    ),
  };
}

/** Editable question card with debounced auto-save. */
export function RenderQuestionCard({
  question,
  questionNumber,
  autoFocus = false,
  fieldErrors = {},
  onSave,
  onDraftChange,
  onRequestDelete,
}: RenderQuestionCardProps) {
  const [draft, setDraft] = useState<RenderQuestionDraft>(() =>
    buildDraft(question)
  );
  const [saveStatus, setSaveStatus] = useState<MissionarySaveStatus>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasUserEdited = useRef(false);
  const saveRequestId = useRef(0);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const latestSaved = useRef(toQuestionDraft(question));
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;

  // Sync from server; auto-reset incompatible insight categories to None.
  useEffect(() => {
    const next = buildDraft(question);
    const serverDraft = toQuestionDraft(question);
    latestSaved.current = serverDraft;

    if (hasUserEdited.current) {
      return;
    }

    setDraft(next);
    setSaveStatus("saved");
    setSaveError(null);

    // Persist a corrected category if the saved pair is no longer allowed.
    if (next.insight_category !== serverDraft.insight_category) {
      hasUserEdited.current = true;
      setDraft({ ...next });
    }
  }, [question.id, question.updated_at]);

  useEffect(() => {
    onDraftChangeRef.current(question.id, draft);
  }, [draft, question.id]);

  useEffect(() => {
    if (!autoFocus) return;
    textRef.current?.focus();
  }, [autoFocus, question.id]);

  useEffect(() => {
    if (!hasUserEdited.current) {
      return;
    }

    if (draftsEqual(draft, latestSaved.current)) {
      setSaveStatus("saved");
      setSaveError(null);
      return;
    }

    setSaveStatus("typing");
    setSaveError(null);

    const requestId = ++saveRequestId.current;

    const timer = window.setTimeout(() => {
      void (async () => {
        setSaveStatus("saving");

        try {
          const updated = await onSaveRef.current(question.id, {
            question_text: draft.question_text,
            helper_text: draft.helper_text,
            response_type: draft.response_type,
            insight_category: draft.insight_category,
            required: draft.required,
          });

          if (requestId !== saveRequestId.current) return;

          latestSaved.current = toQuestionDraft(updated);
          hasUserEdited.current = !draftsEqual(draft, latestSaved.current);
          setSaveStatus("saved");
          setSaveError(null);
        } catch (err) {
          if (requestId !== saveRequestId.current) return;

          setSaveStatus("error");
          setSaveError(
            getErrorMessage(
              err,
              "Unable to save changes. Keep editing — we will try again."
            )
          );
        }
      })();
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, question.id]);

  function updateField<K extends keyof RenderQuestionDraft>(
    field: K,
    value: RenderQuestionDraft[K]
  ) {
    hasUserEdited.current = true;
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleResponseTypeChange(nextType: ResponseType) {
    hasUserEdited.current = true;
    setDraft((current) => ({
      ...current,
      response_type: nextType,
      insight_category: resolveInsightCategoryForResponseType(
        nextType,
        current.insight_category
      ),
    }));
  }

  const textFieldId = `question-text-${question.id}`;
  const responseFieldId = `response-type-${question.id}`;
  const insightFieldId = `insight-category-${question.id}`;
  const requiredFieldId = `required-${question.id}`;

  // Insight combo errors are prevented in UI — do not surface them as field errors.
  const displayErrors: RenderQuestionFieldErrors = {
    question_text: fieldErrors.question_text,
    response_type: fieldErrors.response_type,
  };
  const hasErrors = Boolean(
    displayErrors.question_text || displayErrors.response_type
  );

  return (
    <article
      className={cx(
        "render-question-card",
        hasErrors && "render-question-card--invalid"
      )}
    >
      <div className="render-question-card__header">
        <h3 className="render-question-card__title">Question {questionNumber}</h3>
        <AutoSaveBadge status={saveStatus} error={saveError} />
      </div>

      <div className="render-question-card__fields">
        <Field
          label="Question text"
          htmlFor={textFieldId}
          error={displayErrors.question_text}
        >
          <Textarea
            ref={textRef}
            id={textFieldId}
            className="render-question-card__text"
            value={draft.question_text}
            onChange={(event) =>
              updateField("question_text", event.target.value)
            }
            placeholder="Write your question..."
            rows={3}
            aria-invalid={displayErrors.question_text ? true : undefined}
          />
        </Field>

        <div className="render-question-card__meta">
          <Field
            label="Response type"
            htmlFor={responseFieldId}
            error={displayErrors.response_type}
          >
            <Select
              id={responseFieldId}
              value={draft.response_type}
              onChange={(event) =>
                handleResponseTypeChange(event.target.value as ResponseType)
              }
              aria-invalid={displayErrors.response_type ? true : undefined}
            >
              {RESPONSE_TYPE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {RESPONSE_TYPE_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Insight category"
            htmlFor={insightFieldId}
            hint="Only assign an Insight Category if this question should help TutorTrack identify missionaries who may benefit from additional support."
          >
            <Select
              id={insightFieldId}
              value={draft.insight_category}
              onChange={(event) =>
                updateField(
                  "insight_category",
                  event.target.value as InsightCategory
                )
              }
            >
              {INSIGHT_CATEGORY_OPTIONS.map((value) => {
                const allowed = isInsightCategoryAllowed(
                  draft.response_type,
                  value
                );
                return (
                  <option key={value} value={value} disabled={!allowed}>
                    {INSIGHT_CATEGORY_LABELS[value]}
                  </option>
                );
              })}
            </Select>
          </Field>
        </div>

        <div className="render-question-card__footer">
          <Checkbox
            id={requiredFieldId}
            label="Required"
            checked={draft.required}
            onChange={(event) => updateField("required", event.target.checked)}
          />

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onRequestDelete(question)}
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}
