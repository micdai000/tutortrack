import "../../styles/confirm-dialog.css";

type ConfirmCompleteFollowUpDialogProps = {
  missionaryName: string;
  submitting: boolean;
  error: string | null;
  onDismiss: () => void;
  onConfirm: () => void;
};

/** Confirms clearing a scheduled follow-up date and notes. */
export function ConfirmCompleteFollowUpDialog({
  missionaryName,
  submitting,
  error,
  onDismiss,
  onConfirm,
}: ConfirmCompleteFollowUpDialogProps) {
  return (
    <div
      className="confirm-dialog-backdrop"
      role="presentation"
      onClick={submitting ? undefined : onDismiss}
    >
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-follow-up-title"
        aria-describedby="complete-follow-up-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="complete-follow-up-title">Complete Follow-up?</h2>

        <div
          id="complete-follow-up-description"
          className="confirm-dialog-body"
        >
          <p>
            This will remove the scheduled follow-up and clear the follow-up
            notes
            {missionaryName ? (
              <>
                {" "}
                for <strong>{missionaryName}</strong>
              </>
            ) : null}
            .
          </p>
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
            onClick={onDismiss}
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
            {submitting ? "Saving..." : "Mark Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
