import "../../styles/confirm-dialog.css";

type ConfirmCheckInCompleteDialogProps = {
  missionaryName: string;
  submitting: boolean;
  error: string | null;
  onDismiss: () => void;
  onConfirm: () => void;
};

/** Confirms completing a Missionaries in Need check-in. */
export function ConfirmCheckInCompleteDialog({
  missionaryName,
  submitting,
  error,
  onDismiss,
  onConfirm,
}: ConfirmCheckInCompleteDialogProps) {
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
        aria-labelledby="complete-check-in-title"
        aria-describedby="complete-check-in-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="complete-check-in-title">Complete Check-in?</h2>

        <div
          id="complete-check-in-description"
          className="confirm-dialog-body"
        >
          <p>
            This will remove
            {missionaryName ? (
              <>
                {" "}
                <strong>{missionaryName}</strong>
              </>
            ) : (
              " this missionary"
            )}{" "}
            from Missionaries in Need for this issue. They will stay hidden
            after refresh, and only reappear if the system flags a new issue.
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
            className="confirm-dialog-primary"
            onClick={onConfirm}
            disabled={submitting}
            autoFocus
          >
            {submitting ? "Saving..." : "Check in Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
