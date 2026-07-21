import type { MissionaryProfileDraft } from "../types/missionary";
import { formatLastUpdated } from "../utils/formatLastUpdated";

type MissionaryProfileFormProps = {
  draft: MissionaryProfileDraft;
  lastUpdatedAt: string;
  onChange: <K extends keyof MissionaryProfileDraft>(
    field: K,
    value: MissionaryProfileDraft[K]
  ) => void;
};

export function MissionaryProfileForm({
  draft,
  lastUpdatedAt,
  onChange,
}: MissionaryProfileFormProps) {
  return (
    <div className="missionary-profile-form">
      <div className="missionary-field">
        <label htmlFor="missionary-name">Name</label>
        <input
          id="missionary-name"
          type="text"
          value={draft.display_name}
          onChange={(event) => onChange("display_name", event.target.value)}
          maxLength={120}
        />
      </div>

      <div className="missionary-field">
        <label htmlFor="short-term-goal">Short-Term Goal</label>
        <textarea
          id="short-term-goal"
          rows={3}
          value={draft.short_term_goal}
          onChange={(event) => onChange("short_term_goal", event.target.value)}
        />
      </div>

      <div className="missionary-field">
        <label htmlFor="current-study-plan">Current Language Study Plan</label>
        <textarea
          id="current-study-plan"
          className="missionary-field-large"
          rows={8}
          value={draft.current_study_plan}
          onChange={(event) =>
            onChange("current_study_plan", event.target.value)
          }
        />
      </div>

      <div className="missionary-field">
        <label htmlFor="tutor-notes">Tutor Notes</label>
        <textarea
          id="tutor-notes"
          rows={4}
          value={draft.tutor_notes}
          onChange={(event) => onChange("tutor_notes", event.target.value)}
        />
      </div>

      <div className="missionary-field">
        <label htmlFor="long-term-goal">Long-Term Goal</label>
        <textarea
          id="long-term-goal"
          rows={3}
          value={draft.long_term_goal}
          onChange={(event) => onChange("long_term_goal", event.target.value)}
        />
      </div>

      <div className="missionary-field">
        <label htmlFor="follow-up-date">Follow-up Date</label>
        <input
          id="follow-up-date"
          type="date"
          value={draft.follow_up_date}
          onChange={(event) => onChange("follow_up_date", event.target.value)}
        />
      </div>

      <div className="missionary-field missionary-field--readonly">
        <span className="missionary-field-label">Last Updated</span>
        <p className="missionary-last-updated">
          {formatLastUpdated(lastUpdatedAt)}
        </p>
      </div>
    </div>
  );
}
