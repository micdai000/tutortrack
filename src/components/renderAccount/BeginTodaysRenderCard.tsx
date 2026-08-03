import { SectionCard } from "../layout";
import { Button } from "../ui";

type BeginTodaysRenderCardProps = {
  canBegin: boolean;
  beginning: boolean;
  cancelling: boolean;
  googleFormUrl: string | null;
  /** begun | already_begun after a successful action or page load check */
  resultStatus: "begun" | "already_begun" | null;
  copyStatus: string | null;
  error: string | null;
  disabledReason: string | null;
  onBeginClick: () => void;
  onCopyClick: () => void;
  onCancelClick: () => void;
};

/** Daily workflow: open today's sessions and copy the shared Google Form link. */
export function BeginTodaysRenderCard({
  canBegin,
  beginning,
  cancelling,
  googleFormUrl,
  resultStatus,
  copyStatus,
  error,
  disabledReason,
  onBeginClick,
  onCopyClick,
  onCancelClick,
}: BeginTodaysRenderCardProps) {
  const todayHasBegun = resultStatus !== null;
  const canCopy = Boolean(googleFormUrl) && todayHasBegun;
  const actionsBusy = beginning || cancelling;

  return (
    <SectionCard
      className="begin-todays-card"
      title="Today's Render an Account"
      description="Open today's Language Study Sessions for every district, then share one Google Form link in each district's Google Chat."
    >
      {error && (
        <p className="begin-todays-card__error" role="alert">
          {error}
        </p>
      )}

      {todayHasBegun && (
        <div className="begin-todays-card__success" role="status">
          <p className="begin-todays-card__success-title">
            You have begun today&apos;s Render an Account session.
          </p>
          <p className="begin-todays-card__success-body">
            Copy the Google Form link below and share it with each district in
            Google Chat. If you opened today by mistake, you can cancel
            today&apos;s session.
          </p>
        </div>
      )}

      {!todayHasBegun && disabledReason && (
        <p className="begin-todays-card__hint">{disabledReason}</p>
      )}

      <div className="begin-todays-card__actions">
        {!todayHasBegun && (
          <Button
            type="button"
            variant="primary"
            onClick={onBeginClick}
            disabled={actionsBusy || !canBegin}
          >
            {beginning
              ? "Opening today's sessions..."
              : "Begin Today's Render an Account"}
          </Button>
        )}

        {canCopy && (
          <Button
            type="button"
            variant="primary"
            onClick={onCopyClick}
            disabled={actionsBusy}
          >
            Copy Google Form Link
          </Button>
        )}

        {todayHasBegun && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancelClick}
            disabled={actionsBusy}
          >
            {cancelling
              ? "Cancelling..."
              : "Cancel Today's Render an Account"}
          </Button>
        )}
      </div>

      {copyStatus && (
        <p className="begin-todays-card__copy-status" role="status">
          {copyStatus}
        </p>
      )}
    </SectionCard>
  );
}
