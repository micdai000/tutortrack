import "../styles/confirm-dialog.css";

type ConfirmRemoveMissionaryDialogProps = {
  missionaryName: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirms removing one missionary from a companionship. */
export function ConfirmRemoveMissionaryDialog({
  missionaryName,
  submitting,
  error,
  onCancel,
  onConfirm,
}: ConfirmRemoveMissionaryDialogProps) {
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
        aria-labelledby="remove-missionary-title"
        aria-describedby="remove-missionary-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="remove-missionary-title">Remove missionary?</h2>

        <div id="remove-missionary-description" className="confirm-dialog-body">
          <p>
            <strong>{missionaryName}</strong> will be removed from this
            companionship.
          </p>
          <p>Their language plan will also be permanently deleted.</p>
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
            {submitting ? "Removing..." : "Remove missionary"}
          </button>
        </div>
      </div>
    </div>
  );
}
