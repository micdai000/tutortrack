import "../styles/confirm-dialog.css";

type ConfirmDeleteDistrictDialogProps = {
  districtName: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Blocks accidental deletes with a clear, explicit confirmation. */
export function ConfirmDeleteDistrictDialog({
  districtName,
  submitting,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeleteDistrictDialogProps) {
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
        aria-labelledby="delete-district-title"
        aria-describedby="delete-district-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-district-title">Delete district?</h2>

        <div id="delete-district-description" className="confirm-dialog-body">
          <p>
            <strong>{districtName}</strong> will be permanently deleted.
          </p>
          <p>
            All companionships and missionaries in this district will also be
            deleted.
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
            {submitting ? "Deleting..." : "Delete district"}
          </button>
        </div>
      </div>
    </div>
  );
}
