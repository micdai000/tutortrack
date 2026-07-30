import { SectionCard } from "../layout";
import { Button } from "../ui";

type BeginTodaysRenderCardProps = {
  canBegin: boolean;
  beginning: boolean;
  googleFormUrl: string | null;
  /** begun | already_begun after a successful action or page load check */
  resultStatus: "begun" | "already_begun" | null;
  copyStatus: string | null;
  error: string | null;
  disabledReason: string | null;
  onBeginClick: () => void;
  onCopyClick: () => void;
};

/** Daily workflow: open today's sessions and copy the shared Google Form link. */
export function BeginTodaysRenderCard({
  canBegin,
  beginning,
  googleFormUrl,
  resultStatus,
  copyStatus,
  error,
  disabledReason,
  onBeginClick,
  onCopyClick,
}: BeginTodaysRenderCardProps) {
  const showCopy = Boolean(googleFormUrl) && resultStatus !== null;

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

      {resultStatus === "begun" && (
        <div className="begin-todays-card__success" role="status">
          <p className="begin-todays-card__success-title">
            Today&apos;s Render an Account is ready.
          </p>
          <p className="begin-todays-card__success-body">
            Copy the Google Form link below and share it with each district in
            Google Chat.
          </p>
        </div>
      )}

      {resultStatus === "already_begun" && (
        <div className="begin-todays-card__success" role="status">
          <p className="begin-todays-card__success-title">
            Today&apos;s Render an Account has already begun.
          </p>
          <p className="begin-todays-card__success-body">
            Copy the Google Form link below and share it with each district in
            Google Chat.
          </p>
        </div>
      )}

      {!resultStatus && disabledReason && (
        <p className="begin-todays-card__hint">{disabledReason}</p>
      )}

      <div className="begin-todays-card__actions">
        <Button
          type="button"
          variant="primary"
          onClick={onBeginClick}
          disabled={beginning || !canBegin}
        >
          {beginning
            ? "Opening today's sessions..."
            : "Begin Today's Render an Account"}
        </Button>

        {showCopy && (
          <Button type="button" variant="secondary" onClick={onCopyClick}>
            Copy Google Form Link
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
