import { SectionCard, StatusBadge } from "../layout";
import { Button } from "../ui";
import type { GoogleConnectionSummary } from "../../types/googleConnection";
import type { RenderAccount } from "../../types/renderAccount";
import { formatLastUpdated } from "../../utils/formatLastUpdated";
import { cx } from "../ui/cx";

type GoogleFormsCardProps = {
  account: RenderAccount | null;
  connection: GoogleConnectionSummary | null;
  loading: boolean;
  connecting: boolean;
  publishing: boolean;
  error: string | null;
  canPublish: boolean;
  onPublishClick: () => void;
};

function isPublished(account: RenderAccount | null): boolean {
  return Boolean(account?.google_form_id && account.google_form_url);
}

/** Google Forms connection + publish status for the Render an Account page. */
export function GoogleFormsCard({
  account,
  connection,
  loading,
  connecting,
  publishing,
  error,
  canPublish,
  onPublishClick,
}: GoogleFormsCardProps) {
  const isConnected = connection !== null;
  const published = isPublished(account);
  const busy = loading || connecting || publishing;

  return (
    <SectionCard
      className={cx(
        "google-forms-card",
        published
          ? "google-forms-card--published"
          : isConnected
            ? "google-forms-card--connected"
            : "google-forms-card--idle"
      )}
      title="Google Forms"
      actions={
        !busy && (
          <StatusBadge
            tone={published ? "success" : isConnected ? "success" : "neutral"}
          >
            {published
              ? "Published"
              : isConnected
                ? "Connected"
                : "Not Connected"}
          </StatusBadge>
        )
      }
    >
      {busy && (
        <p className="google-forms-card__status" role="status">
          {publishing
            ? "Creating your Google Form..."
            : connecting
              ? "Redirecting to Google..."
              : "Checking Google connection..."}
        </p>
      )}

      {!busy && error && (
        <p className="google-forms-card__error" role="alert">
          {error}
        </p>
      )}

      {!busy && !isConnected && (
        <div className="google-forms-card__body">
          <dl className="google-forms-card__metrics">
            <div className="google-forms-card__metric">
              <dt>Status</dt>
              <dd>Not Connected</dd>
            </div>
          </dl>

          <p className="google-forms-card__description">
            Connect Google, then publish your Render an Account so missionaries
            can begin submitting responses.
          </p>

          <div className="google-forms-card__actions">
            <Button
              type="button"
              variant="primary"
              onClick={onPublishClick}
              disabled={connecting}
            >
              Publish to Google Forms
            </Button>
          </div>
        </div>
      )}

      {!busy && isConnected && !published && (
        <div className="google-forms-card__body">
          <dl className="google-forms-card__metrics">
            <div className="google-forms-card__metric">
              <dt>Status</dt>
              <dd className="google-forms-card__value--ok">Connected</dd>
            </div>

            <div className="google-forms-card__metric">
              <dt>Google email</dt>
              <dd>{connection.google_email}</dd>
            </div>

            <div className="google-forms-card__metric">
              <dt>Connected date</dt>
              <dd>{formatLastUpdated(connection.connected_at)}</dd>
            </div>

            <div className="google-forms-card__metric">
              <dt>Google Form Status</dt>
              <dd>Not Created Yet</dd>
            </div>
          </dl>

          <p className="google-forms-card__description">
            Publish creates your permanent Google Form and Responses spreadsheet.
            {!canPublish
              ? " Fix validation errors in your questions before publishing."
              : ""}
          </p>

          <div className="google-forms-card__actions">
            <Button
              type="button"
              variant="primary"
              onClick={onPublishClick}
              disabled={publishing || !canPublish}
            >
              Publish to Google Forms
            </Button>
          </div>
        </div>
      )}

      {!busy && isConnected && published && account && (
        <div className="google-forms-card__body">
          <dl className="google-forms-card__metrics">
            <div className="google-forms-card__metric">
              <dt>Status</dt>
              <dd className="google-forms-card__value--ok">Google Connected</dd>
            </div>

            <div className="google-forms-card__metric">
              <dt>Google Form</dt>
              <dd className="google-forms-card__value--ok">
                Google Form Created
              </dd>
            </div>

            <div className="google-forms-card__metric">
              <dt>Published</dt>
              <dd>
                {account.published_at
                  ? formatLastUpdated(account.published_at)
                  : "Published"}
              </dd>
            </div>

            <div className="google-forms-card__metric">
              <dt>Google email</dt>
              <dd>{connection.google_email}</dd>
            </div>
          </dl>

          <div className="google-forms-card__actions google-forms-card__actions--links">
            {account.google_form_url && (
              <a
                className="google-forms-card__link"
                href={account.google_form_url}
                target="_blank"
                rel="noreferrer"
              >
                View Google Form
              </a>
            )}
            {account.google_sheet_url && (
              <a
                className="google-forms-card__link"
                href={account.google_sheet_url}
                target="_blank"
                rel="noreferrer"
              >
                Open Responses Sheet
              </a>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
