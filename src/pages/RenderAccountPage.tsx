import { useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";

import {
  ConfirmDeleteQuestionDialog,
  GoogleFormsCard,
  RenderQuestionCard,
  RenderStatusCard,
} from "../components/renderAccount";
import { EmptyState, PageContainer, PageHeader } from "../components/layout";
import { Button, Icon } from "../components/ui";
import { useEnsureRenderAccount } from "../hooks/useEnsureRenderAccount";
import { useGoogleConnection } from "../hooks/useGoogleConnection";
import { useRenderQuestions } from "../hooks/useRenderQuestions";
import { toQuestionDraft } from "../services/renderAccountService";
import type {
  RenderQuestion,
  RenderQuestionDraft,
} from "../types/renderAccount";
import { getErrorMessage } from "../utils/getErrorMessage";
import { validateRenderAccount } from "../utils/renderAccountValidation";
import { publishGoogleForm } from "../services/googleConnectionService";
import "../styles/missionary-profile.css";
import "../styles/render-account.css";

function RenderAccountPage() {
  const {
    account,
    loading: accountLoading,
    error: accountError,
    refresh: refreshAccount,
  } = useEnsureRenderAccount();

  const {
    questions,
    loading: questionsLoading,
    error: questionsError,
    create,
    update,
    remove,
  } = useRenderQuestions(account?.id);

  const {
    connection: googleConnection,
    loading: googleLoading,
    connecting: googleConnecting,
    error: googleError,
    connect: connectGoogle,
  } = useGoogleConnection();

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [focusQuestionId, setFocusQuestionId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] =
    useState<RenderQuestion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [draftsById, setDraftsById] = useState<
    Record<string, RenderQuestionDraft>
  >({});

  const loading = accountLoading || (Boolean(account) && questionsLoading);
  const loadError = accountError ?? questionsError;

  const validationSummary = useMemo(() => {
    const validatable = questions.map((question) => {
      const draft = draftsById[question.id] ?? toQuestionDraft(question);
      return {
        id: question.id,
        question_text: draft.question_text,
        response_type: draft.response_type,
        insight_category: draft.insight_category,
        options: draft.options,
      };
    });

    return validateRenderAccount(validatable);
  }, [questions, draftsById]);

  function handleDraftChange(questionId: string, draft: RenderQuestionDraft) {
    setDraftsById((current) => {
      const existing = current[questionId];
      if (
        existing &&
        existing.question_text === draft.question_text &&
        existing.helper_text === draft.helper_text &&
        existing.response_type === draft.response_type &&
        existing.insight_category === draft.insight_category &&
        existing.required === draft.required &&
        existing.options.length === draft.options.length &&
        existing.options.every(
          (option, index) => option === draft.options[index]
        )
      ) {
        return current;
      }

      return { ...current, [questionId]: draft };
    });
  }

  async function handleAddQuestion() {
    if (!account || adding) return;

    setAdding(true);
    setAddError(null);

    try {
      const created = await create({
        question_text: "",
        helper_text: "",
        response_type: "SHORT_TEXT",
        insight_category: "NONE",
        required: true,
      });
      setFocusQuestionId(created.id);
    } catch (err) {
      setAddError(getErrorMessage(err, "Unable to add a question."));
    } finally {
      setAdding(false);
    }
  }

  async function handleConfirmDelete() {
    if (!questionToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await remove(questionToDelete.id);
      setDraftsById((current) => {
        const next = { ...current };
        delete next[questionToDelete.id];
        return next;
      });
      if (focusQuestionId === questionToDelete.id) {
        setFocusQuestionId(null);
      }
      setQuestionToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Unable to delete this question."));
    } finally {
      setDeleting(false);
    }
  }

  /** Connect Google if needed; otherwise create the permanent Google Form. */
  async function handlePublishToGoogleForms() {
    setPublishError(null);

    if (!googleConnection) {
      void connectGoogle();
      return;
    }

    if (account?.google_form_id) {
      return;
    }

    if (!validationSummary.isPublishable) {
      setPublishError(
        "Fix validation errors before publishing to Google Forms."
      );
      return;
    }

    setPublishing(true);

    try {
      await publishGoogleForm();
      await refreshAccount({ silent: true });
    } catch (err) {
      setPublishError(
        getErrorMessage(err, "Unable to publish to Google Forms.")
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <PageContainer className="render-account-page">
      <PageHeader title="Render an Account" />

      <div className="render-account-intro">
        <p>
          Create the questions your missionaries answer after each language
          study.
        </p>
        <p>Questions may be written however you&apos;d like.</p>
        <p>
          Assigning an Insight Category allows TutorTrack to identify
          missionaries who may benefit from additional support.
        </p>
      </div>

      {loading && (
        <p className="render-account-status" role="status">
          Loading Render an Account...
        </p>
      )}

      {!loading && loadError && (
        <p className="render-account-error" role="alert">
          {loadError}
        </p>
      )}

      {!loading && !loadError && account && (
        <div className="render-account-body">
          <RenderStatusCard summary={validationSummary} />

          <GoogleFormsCard
            account={account}
            connection={googleConnection}
            loading={googleLoading}
            connecting={googleConnecting}
            publishing={publishing}
            error={publishError ?? googleError}
            canPublish={validationSummary.isPublishable}
            onPublishClick={() => void handlePublishToGoogleForms()}
          />

          {questions.length === 0 ? (
            <div className="render-account-empty-panel">
              <EmptyState
                icon={ClipboardList}
                title="Your Render an Account is Ready to Build"
                variant="inline"
              />
              <div className="render-account-empty-copy">
                <p>
                  Create the questions your missionaries answer after each
                  language study.
                </p>
                <p>Questions can be completely customized.</p>
                <p>
                  Only assign an Insight Category if you would like TutorTrack
                  to use that response to identify missionaries who may benefit
                  from additional support.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => void handleAddQuestion()}
                disabled={adding}
              >
                <Icon icon={Plus} size="sm" />
                {adding ? "Adding..." : "Add First Question"}
              </Button>
            </div>
          ) : (
            <>
              <div className="render-question-list">
                {questions.map((question, index) => (
                  <RenderQuestionCard
                    key={question.id}
                    question={question}
                    questionNumber={index + 1}
                    autoFocus={focusQuestionId === question.id}
                    fieldErrors={
                      validationSummary.questionErrors[question.id] ?? {}
                    }
                    onSave={update}
                    onDraftChange={handleDraftChange}
                    onRequestDelete={setQuestionToDelete}
                  />
                ))}
              </div>

              <div className="render-account-add">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleAddQuestion()}
                  disabled={adding}
                >
                  <Icon icon={Plus} size="sm" />
                  {adding ? "Adding..." : "Add Question"}
                </Button>
              </div>
            </>
          )}

          {addError && (
            <p className="render-account-error" role="alert">
              {addError}
            </p>
          )}
        </div>
      )}

      {questionToDelete && (
        <ConfirmDeleteQuestionDialog
          questionPreview={questionToDelete.question_text}
          submitting={deleting}
          error={deleteError}
          onCancel={() => {
            if (deleting) return;
            setQuestionToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={() => void handleConfirmDelete()}
        />
      )}
    </PageContainer>
  );
}

export default RenderAccountPage;
