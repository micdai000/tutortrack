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
  syncing: boolean;
  syncSuccess: boolean;
  error: string | null;
  canPublish: boolean;
  canSync: boolean;
  onPublishClick: () => void;
  onSyncClick: () => void;
};

function isPublished(account: RenderAccount | null): boolean {
  return Boolean(account?.google_form_id && account.google_form_url);
}

function syncStatusLabel(account: RenderAccount): string {
  if (account.needs_sync || account.sync_status === "changes_pending") {
    return "Changes Pending";
  }
  return "Up To Date";
}

/** Google Forms connection, create, and manual sync status. */
export function GoogleFormsCard({
  account,
  connection,
  loading,
  connecting,
  publishing,
  syncing,
  syncSuccess,
  error,
  canPublish,
  canSync,
  onPublishClick,
  onSyncClick,
}: GoogleFormsCardProps) {
  const isConnected = connection !== null;
  const published = isPublished(account);
  const busy = loading || connecting || publishing || syncing;
  const changesPending = Boolean(
    account &&
      (account.needs_sync || account.sync_status === "changes_pending")
  );

  return (
    <SectionCard
      className={cx(
        "google-forms-card",
        published
          ? changesPending
            ? "google-forms-card--pending"
            : "google-forms-card--published"
          : isConnected
            ? "google-forms-card--connected"
            : "google-forms-card--idle"
      )}
      title="Google Forms"
      actions={
        !busy &&
        published && (
          <StatusBadge tone={changesPending ? "warning" : "success"}>
            {syncStatusLabel(account!)}
          </StatusBadge>
        )
      }
    >
      {busy && (
        <p className="google-forms-card__status" role="status">
          {syncing
            ? "Syncing changes to Google Forms..."
            : publishing
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

      {!busy && !error && syncSuccess && published && (
        <p className="google-forms-card__success" role="status">
          Google Form is up to date.
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
            Connect Google, then create your permanent Google Form so
            missionaries can begin submitting responses.
          </p>

          <div className="google-forms-card__actions">
            <Button
              type="button"
              variant="primary"
              onClick={onPublishClick}
              disabled={connecting}
            >
              Connect Google
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
            Create your permanent Google Form and linked Responses spreadsheet.
            TutorTrack will never create a duplicate form.
            {!canPublish
              ? " Fix validation errors in your questions before creating the form."
              : ""}
          </p>

          <div className="google-forms-card__actions">
            <Button
              type="button"
              variant="primary"
              onClick={onPublishClick}
              disabled={publishing || !canPublish}
            >
              Create Google Form
            </Button>
          </div>
        </div>
      )}

      {!busy && isConnected && published && account && (
        <div className="google-forms-card__body">
          <dl className="google-forms-card__metrics">
            <div className="google-forms-card__metric">
              <dt>Google Connected</dt>
              <dd className="google-forms-card__value--ok">Connected</dd>
            </div>

            <div className="google-forms-card__metric">
              <dt>Google Form</dt>
              <dd className="google-forms-card__value--ok">
                Google Form Created
              </dd>
            </div>

            <div className="google-forms-card__metric">
              <dt>Status</dt>
              <dd
                className={
                  changesPending
                    ? "google-forms-card__value--pending"
                    : "google-forms-card__value--ok"
                }
              >
                {syncStatusLabel(account)}
              </dd>
            </div>

            <div className="google-forms-card__metric">
              <dt>Last Synced</dt>
              <dd>
                {account.last_synced_at
                  ? formatLastUpdated(account.last_synced_at)
                  : "Not synced yet"}
              </dd>
            </div>

            <div className="google-forms-card__metric">
              <dt>Response Pipeline</dt>
              <dd
                className={
                  account.response_pipeline_status === "installed"
                    ? "google-forms-card__value--ok"
                    : account.response_pipeline_status === "error"
                      ? "google-forms-card__value--pending"
                      : undefined
                }
              >
                {account.response_pipeline_status === "installed"
                  ? "Installed"
                  : account.response_pipeline_status === "error"
                    ? "Needs Attention"
                    : "Not Installed"}
              </dd>
            </div>
          </dl>

          {account.response_pipeline_status === "error" &&
            account.response_pipeline_error && (
              <p className="google-forms-card__error" role="alert">
                {account.response_pipeline_error}
              </p>
            )}

          <p className="google-forms-card__description">
            TutorTrack is the source of truth. Edit questions here, then sync
            when you are ready to update Google Forms. Sync also imports any new
            Google Form responses into TutorTrack.
            {!canSync && changesPending
              ? " Fix validation errors before syncing."
              : ""}
          </p>

          <div className="google-forms-card__actions">
            <Button
              type="button"
              variant="primary"
              onClick={onSyncClick}
              disabled={syncing || !canSync}
            >
              Sync Changes
            </Button>

            {account.google_form_url && (
              <a
                className="google-forms-card__link"
                href={account.google_form_url}
                target="_blank"
                rel="noreferrer"
              >
                Open Google Form
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
