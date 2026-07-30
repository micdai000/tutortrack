import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Icon } from "../ui";
import type { LanguageStudyMissionaryRow } from "../../types/languageStudySession";
import { formatSubmissionTime } from "../../utils/localDate";
import { cx } from "../ui/cx";

type LanguageStudyMissionaryCardProps = {
  row: LanguageStudyMissionaryRow;
  /** Expand on mount (dashboard deep-link). */
  defaultExpanded?: boolean;
};

/** Collapsible missionary card for one Language Study Session day. */
export function LanguageStudyMissionaryCard({
  row,
  defaultExpanded = false,
}: LanguageStudyMissionaryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const cardRef = useRef<HTMLElement | null>(null);
  const { missionary, session } = row;
  const submitted = session !== null;
  const submittedAt = session?.submitted_at ?? null;

  useEffect(() => {
    if (!defaultExpanded || !cardRef.current) return;
    cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [defaultExpanded]);

  return (
    <article
      ref={cardRef}
      className={cx(
        "lss-card",
        submitted ? "lss-card--submitted" : "lss-card--missing",
        expanded && "lss-card--expanded"
      )}
    >
      <button
        type="button"
        className="lss-card__header"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="lss-card__identity">
          <span className="lss-card__name">{missionary.display_name}</span>
          <span
            className={cx(
              "lss-card__status",
              submitted
                ? "lss-card__status--submitted"
                : "lss-card__status--missing"
            )}
          >
            {submitted && submittedAt
              ? `✓ Submitted • ${formatSubmissionTime(submittedAt)}`
              : submitted
                ? "✓ Submitted"
                : "⏳ No Submission Yet"}
          </span>
        </span>

        <span
          className={cx(
            "lss-card__chevron",
            expanded && "lss-card__chevron--open"
          )}
          aria-hidden="true"
        >
          <Icon icon={ChevronDown} size="sm" />
        </span>
      </button>

      {expanded && (
        <div id={panelId} className="lss-card__body">
          {session ? (
            <LanguageStudySessionDetail session={session} />
          ) : (
            <p className="lss-card__empty">
              No Language Study Session submitted for this date.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function LanguageStudySessionDetail({
  session,
}: {
  session: NonNullable<LanguageStudyMissionaryRow["session"]>;
}) {
  const submittedAt = session.submitted_at;

  return (
    <div className="lss-session">
      <p className="lss-session__meta">
        {submittedAt
          ? `Submitted at ${formatSubmissionTime(submittedAt)}`
          : "Submission time unavailable"}
      </p>

      {session.answers.length === 0 ? (
        <p className="lss-card__empty">
          This session was received, but no question answers were stored.
        </p>
      ) : (
        <ol className="lss-session__questions">
          {session.answers.map((answer) => (
            <li key={answer.id} className="lss-session__question">
              <p className="lss-session__prompt">{answer.question_text}</p>
              <p className="lss-session__answer">
                {answer.response_value?.trim()
                  ? answer.response_value
                  : "No answer provided"}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
