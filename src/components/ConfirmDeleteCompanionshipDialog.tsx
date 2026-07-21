import "../styles/confirm-dialog.css";

type ConfirmDeleteCompanionshipDialogProps = {
  missionaryNames: string[];
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirms deleting an entire companionship and its missionaries. */
export function ConfirmDeleteCompanionshipDialog({
  missionaryNames,
  submitting,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeleteCompanionshipDialogProps) {
  const membersLabel =
    missionaryNames.length > 0
      ? missionaryNames.join(" · ")
      : "This companionship";

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
        aria-labelledby="delete-companionship-title"
        aria-describedby="delete-companionship-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-companionship-title">Delete companionship?</h2>

        <div
          id="delete-companionship-description"
          className="confirm-dialog-body"
        >
          <p>
            <strong>{membersLabel}</strong> will be permanently deleted.
          </p>
          <p>
            All missionaries in this companionship will also be deleted,
            including their language plans.
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
            {submitting ? "Deleting..." : "Delete companionship"}
          </button>
        </div>
      </div>
    </div>
  );
}
