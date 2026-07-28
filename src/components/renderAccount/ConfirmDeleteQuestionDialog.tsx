import "../../styles/confirm-dialog.css";

type ConfirmDeleteQuestionDialogProps = {
  questionPreview: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirms permanent deletion of a Render an Account question. */
export function ConfirmDeleteQuestionDialog({
  questionPreview,
  submitting,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeleteQuestionDialogProps) {
  const preview = questionPreview.trim() || "Untitled question";

  return (
    <div
      className="confirm-dialog-backdrop"
      role="presentation"
      onClick={submitting ? undefined : onCancel}
    >
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-question-title"
        aria-describedby="delete-question-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-question-title">Delete question?</h2>

        <div id="delete-question-description" className="confirm-dialog-body">
          <p>
            <strong>{preview}</strong> will be permanently deleted.
          </p>
          <p>This action cannot be undone.</p>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-cancel"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="confirm-dialog-danger"
            onClick={onConfirm}
            disabled={submitting}
            autoFocus
          >
            {submitting ? "Deleting..." : "Delete question"}
          </button>
        </div>
      </div>
    </div>
  );
}
