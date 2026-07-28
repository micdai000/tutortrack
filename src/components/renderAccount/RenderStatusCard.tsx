import { SectionCard, StatusBadge } from "../layout";
import type { RenderAccountValidationSummary } from "../../utils/renderAccountValidation";
import { cx } from "../ui/cx";

type RenderStatusCardProps = {
  summary: RenderAccountValidationSummary;
};

/** Shows publish readiness for future Google Forms synchronization. */
export function RenderStatusCard({ summary }: RenderStatusCardProps) {
  const {
    totalQuestions,
    questionsWithErrors,
    publishStatus,
    isPublishable,
  } = summary;

  const questionCountLabel =
    totalQuestions === 1 ? "1 question" : `${totalQuestions} questions`;

  const validationLabel =
    questionsWithErrors === 0
      ? "No validation errors"
      : questionsWithErrors === 1
        ? "1 question needs attention"
        : `${questionsWithErrors} questions need attention`;

  return (
    <SectionCard
      className={cx(
        "render-status-card",
        isPublishable
          ? "render-status-card--ready"
          : "render-status-card--draft"
      )}
      title="Render Status"
    >
      <dl className="render-status-card__metrics">
        <div className="render-status-card__metric">
          <dt>Status</dt>
          <dd>
            <StatusBadge tone={isPublishable ? "success" : "warning"}>
              {publishStatus}
            </StatusBadge>
          </dd>
        </div>

        <div className="render-status-card__metric">
          <dt>Question Count</dt>
          <dd>{questionCountLabel}</dd>
        </div>

        <div className="render-status-card__metric">
          <dt>Validation Status</dt>
          <dd
            className={cx(
              questionsWithErrors === 0
                ? "render-status-card__value--ok"
                : "render-status-card__value--warn"
            )}
          >
            {validationLabel}
          </dd>
        </div>
      </dl>

      <div className="render-status-card__future">
        <p className="render-status-card__future-label">Future Integrations</p>
        <div className="render-status-card__future-row">
          <span className="render-status-card__future-name">
            Google Forms Sync
          </span>
          <span className="render-status-card__future-badge">Coming Soon</span>
        </div>
      </div>
    </SectionCard>
  );
}
