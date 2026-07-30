import { SectionCard } from "../layout";
import {
  formatLocalDateLabel,
  isLocalToday,
} from "../../utils/localDate";

type LanguageStudySummaryProps = {
  dateKey: string;
  submittedCount: number;
  missingCount: number;
  totalCount: number;
};

/** Compact submission counts for the selected district + date. */
export function LanguageStudySummary({
  dateKey,
  submittedCount,
  missingCount,
  totalCount,
}: LanguageStudySummaryProps) {
  const title = isLocalToday(dateKey)
    ? "Today's Render an Account Reports"
    : `${formatLocalDateLabel(dateKey)} Render an Account Reports`;

  return (
    <SectionCard className="lss-summary" title={title}>
      <dl className="lss-summary__metrics">
        <div className="lss-summary__metric">
          <dt className="lss-summary__label">Submitted</dt>
          <dd className="lss-summary__value">
            {submittedCount} / {totalCount}
          </dd>
        </div>
        <div className="lss-summary__metric">
          <dt className="lss-summary__label">No Submission Yet</dt>
          <dd className="lss-summary__value lss-summary__value--missing">
            {missingCount}
          </dd>
        </div>
      </dl>
    </SectionCard>
  );
}
