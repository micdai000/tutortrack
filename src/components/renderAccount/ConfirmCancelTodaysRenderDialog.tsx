import "../../styles/confirm-dialog.css";

type ConfirmCancelTodaysRenderDialogProps = {
  submitting: boolean;
  error: string | null;
  onDismiss: () => void;
  onConfirm: () => void;
};

/** Confirms cancelling today's opened Render an Account sessions. */
export function ConfirmCancelTodaysRenderDialog({
  submitting,
  error,
  onDismiss,
  onConfirm,
}: ConfirmCancelTodaysRenderDialogProps) {
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
        aria-labelledby="cancel-todays-render-title"
        aria-describedby="cancel-todays-render-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="cancel-todays-render-title">
          Cancel today&apos;s Render an Account?
        </h2>

        <div
          id="cancel-todays-render-description"
          className="confirm-dialog-body"
        >
          <p>
            This will cancel today&apos;s opened Language Study Sessions for
            all districts.
          </p>
          <p>
            Today will no longer count as an opened Render an Account day. You
            can begin again later if you hold sessions after all.
          </p>
          <p>
            Missionary responses already received today will remain in
            TutorTrack.
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
            Keep today&apos;s session
          </button>
          <button
            type="button"
            className="confirm-dialog-danger"
            onClick={onConfirm}
            disabled={submitting}
            autoFocus
          >
            {submitting
              ? "Cancelling..."
              : "Cancel today's Render an Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
