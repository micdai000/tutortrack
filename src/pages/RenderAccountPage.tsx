import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";

import {
  BeginTodaysRenderCard,
  ConfirmCancelTodaysRenderDialog,
  ConfirmDeleteQuestionDialog,
  GoogleFormsCard,
  RenderQuestionCard,
  RenderStatusCard,
} from "../components/renderAccount";
import { EmptyState, PageContainer, PageHeader } from "../components/layout";
import { Button, Icon } from "../components/ui";
import { useDistricts } from "../hooks/useDistricts";
import { useEnsureRenderAccount } from "../hooks/useEnsureRenderAccount";
import { useGoogleConnection } from "../hooks/useGoogleConnection";
import { useRenderQuestions } from "../hooks/useRenderQuestions";
import {
  beginTodaysRenderAccount,
  cancelTodaysRenderAccount,
  copyTextToClipboard,
  getOpenSessionsForDate,
} from "../services/languageStudyOpenSessionService";
import { toQuestionDraft } from "../services/renderAccountService";
import type {
  RenderQuestion,
  RenderQuestionDraft,
} from "../types/renderAccount";
import { getErrorMessage } from "../utils/getErrorMessage";
import { validateRenderAccount } from "../utils/renderAccountValidation";
import {
  publishGoogleForm,
  syncGoogleForm,
} from "../services/googleConnectionService";
import { toLocalDateKey } from "../utils/localDate";
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
    create: createQuestion,
    update: updateQuestion,
    remove: removeQuestion,
  } = useRenderQuestions(account?.id);

  const {
    connection: googleConnection,
    loading: googleLoading,
    connecting: googleConnecting,
    error: googleError,
    connect: connectGoogle,
    reconnect: reconnectGoogle,
  } = useGoogleConnection();

  const { districts, loading: districtsLoading } = useDistricts();

  const [publishing, setPublishing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
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
  const [beginningToday, setBeginningToday] = useState(false);
  const [beginTodayStatus, setBeginTodayStatus] = useState<
    "begun" | "already_begun" | null
  >(null);
  const [beginTodayError, setBeginTodayError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [cancelTodayOpen, setCancelTodayOpen] = useState(false);
  const [cancellingToday, setCancellingToday] = useState(false);
  const [cancelTodayError, setCancelTodayError] = useState<string | null>(null);

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

  const hasGoogleForm = Boolean(account?.google_form_url);
  const canBeginToday =
    hasGoogleForm && districts.length > 0 && !districtsLoading;
  const beginDisabledReason = !hasGoogleForm
    ? "Create your Google Form below before beginning today's Render an Account."
    : districts.length === 0 && !districtsLoading
      ? "Add at least one district before beginning today's Render an Account."
      : null;

  useEffect(() => {
    if (!account?.google_form_url || districtsLoading || districts.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadTodayStatus() {
      try {
        const today = toLocalDateKey();
        const sessions = await getOpenSessionsForDate(today);
        if (cancelled) return;

        const openDistrictIds = new Set(
          sessions.map((session) => session.district_id)
        );
        const allOpen = districts.every((district) =>
          openDistrictIds.has(district.id)
        );

        if (allOpen) {
          setBeginTodayStatus("already_begun");
        }
      } catch {
        // Non-blocking — tutor can still begin manually.
      }
    }

    void loadTodayStatus();

    return () => {
      cancelled = true;
    };
  }, [account?.google_form_url, districts, districtsLoading]);

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

  async function refreshAccountAfterEdit() {
    if (account?.google_form_id) {
      setSyncSuccess(false);
      await refreshAccount({ silent: true });
    }
  }

  async function handleSaveQuestion(
    questionId: string,
    updates: Parameters<typeof updateQuestion>[1]
  ) {
    const updated = await updateQuestion(questionId, updates);
    await refreshAccountAfterEdit();
    return updated;
  }

  async function handleAddQuestion() {
    if (!account || adding) return;

    setAdding(true);
    setAddError(null);

    try {
      const created = await createQuestion({
        question_text: "",
        helper_text: "",
        response_type: "SHORT_TEXT",
        insight_category: "NONE",
        required: true,
      });
      setFocusQuestionId(created.id);
      await refreshAccountAfterEdit();
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
      await removeQuestion(questionToDelete.id);
      setDraftsById((current) => {
        const next = { ...current };
        delete next[questionToDelete.id];
        return next;
      });
      if (focusQuestionId === questionToDelete.id) {
        setFocusQuestionId(null);
      }
      setQuestionToDelete(null);
      await refreshAccountAfterEdit();
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Unable to delete this question."));
    } finally {
      setDeleting(false);
    }
  }

  /** Connect Google if needed; otherwise create the permanent Google Form. */
  async function handlePublishToGoogleForms() {
    setPublishError(null);
    setSyncSuccess(false);

    if (!googleConnection) {
      void connectGoogle();
      return;
    }

    if (account?.google_form_id) {
      return;
    }

    if (!validationSummary.isPublishable) {
      setPublishError(
        "Fix validation errors before creating your Google Form."
      );
      return;
    }

    setPublishing(true);

    try {
      await publishGoogleForm();
      await refreshAccount({ silent: true });
    } catch (err) {
      setPublishError(
        getErrorMessage(err, "Unable to create your Google Form.")
      );
    } finally {
      setPublishing(false);
    }
  }

  /** Clear stale Google grant and send the tutor through consent again. */
  async function handleReconnectGoogle() {
    setPublishError(null);
    setSyncSuccess(false);
    await reconnectGoogle();
  }

  /** Push pending TutorTrack edits to the existing Google Form. */
  async function handleSyncChanges() {
    setPublishError(null);
    setSyncSuccess(false);

    if (!googleConnection) {
      setPublishError("Connect Google before syncing changes.");
      return;
    }

    if (!account?.google_form_id) {
      setPublishError("Create your Google Form before syncing changes.");
      return;
    }

    if (!validationSummary.isPublishable) {
      setPublishError("Fix validation errors before syncing to Google Forms.");
      return;
    }

    setSyncing(true);

    try {
      const result = await syncGoogleForm();
      await refreshAccount({ silent: true });
      setSyncSuccess(true);

      if (result.response_pipeline?.status === "error") {
        setPublishError(
          result.response_pipeline.error ||
            "Google Form synced, but the real-time response pipeline needs attention. Sync still imports responses."
        );
        setSyncSuccess(false);
      } else if (
        result.response_import &&
        result.response_import.processed > 0
      ) {
        setPublishError(null);
      }
    } catch (err) {
      setPublishError(getErrorMessage(err, "Unable to sync Google Forms."));
    } finally {
      setSyncing(false);
    }
  }

  async function handleCopyGoogleFormLink(url: string) {
    const copied = await copyTextToClipboard(url);
    setCopyStatus(
      copied
        ? "Google Form link copied."
        : "Unable to copy automatically. Try Copy Google Form Link again."
    );
  }

  async function handleBeginTodaysRender() {
    setBeginTodayError(null);
    setCopyStatus(null);
    setBeginningToday(true);

    try {
      const result = await beginTodaysRenderAccount();
      setBeginTodayStatus(result.status);
      const copied = await copyTextToClipboard(result.googleFormUrl);
      setCopyStatus(
        copied
          ? "Google Form link copied."
          : "Sessions are ready. Use Copy Google Form Link to copy manually."
      );
    } catch (err) {
      setBeginTodayError(
        getErrorMessage(err, "Unable to begin today's Render an Account.")
      );
    } finally {
      setBeginningToday(false);
    }
  }

  async function handleConfirmCancelTodaysRender() {
    setCancelTodayError(null);
    setCancellingToday(true);

    try {
      await cancelTodaysRenderAccount();
      setBeginTodayStatus(null);
      setCopyStatus(null);
      setBeginTodayError(null);
      setCancelTodayOpen(false);
    } catch (err) {
      setCancelTodayError(
        getErrorMessage(err, "Unable to cancel today's Render an Account.")
      );
    } finally {
      setCancellingToday(false);
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
          <BeginTodaysRenderCard
            canBegin={canBeginToday}
            beginning={beginningToday}
            cancelling={cancellingToday}
            googleFormUrl={account.google_form_url}
            resultStatus={beginTodayStatus}
            copyStatus={copyStatus}
            error={beginTodayError}
            disabledReason={beginDisabledReason}
            onBeginClick={() => void handleBeginTodaysRender()}
            onCopyClick={() => {
              if (account.google_form_url) {
                void handleCopyGoogleFormLink(account.google_form_url);
              }
            }}
            onCancelClick={() => {
              setCancelTodayError(null);
              setCancelTodayOpen(true);
            }}
          />

          {cancelTodayOpen && (
            <ConfirmCancelTodaysRenderDialog
              submitting={cancellingToday}
              error={cancelTodayError}
              onDismiss={() => {
                if (cancellingToday) return;
                setCancelTodayOpen(false);
                setCancelTodayError(null);
              }}
              onConfirm={() => void handleConfirmCancelTodaysRender()}
            />
          )}

          <RenderStatusCard summary={validationSummary} />

          <GoogleFormsCard
            account={account}
            connection={googleConnection}
            loading={googleLoading}
            connecting={googleConnecting}
            publishing={publishing}
            syncing={syncing}
            syncSuccess={syncSuccess}
            error={publishError ?? googleError}
            canPublish={validationSummary.isPublishable}
            canSync={validationSummary.isPublishable}
            onPublishClick={() => void handlePublishToGoogleForms()}
            onSyncClick={() => void handleSyncChanges()}
            onReconnectClick={() => void handleReconnectGoogle()}
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
                    onSave={handleSaveQuestion}
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
