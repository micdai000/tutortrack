import type { MissionaryProfileDraft } from "../types/missionary";
import {
  AutoResizeTextarea,
  MetadataCard,
  MissionaryCard,
  SectionHeader,
} from "./missionary";

type MissionaryProfileFormProps = {
  draft: MissionaryProfileDraft;
  lastUpdatedAt: string;
  onChange: <K extends keyof MissionaryProfileDraft>(
    field: K,
    value: MissionaryProfileDraft[K]
  ) => void;
};

/** Sectioned language-plan editor. Same fields and onChange contract as before. */
export function MissionaryProfileForm({
  draft,
  lastUpdatedAt,
  onChange,
}: MissionaryProfileFormProps) {
  return (
    <div className="missionary-profile-form">
      <MissionaryCard density="compact">
        <SectionHeader title="Missionary" />
        <div className="missionary-field">
          <label htmlFor="missionary-name">Name</label>
          <input
            id="missionary-name"
            type="text"
            value={draft.display_name}
            onChange={(event) => onChange("display_name", event.target.value)}
            maxLength={120}
            autoComplete="name"
          />
        </div>
      </MissionaryCard>

      <MissionaryCard density="compact">
        <SectionHeader title="Goals" />
        <div className="missionary-field-stack">
          <div className="missionary-field">
            <label htmlFor="short-term-goal">Short-term goal</label>
            <AutoResizeTextarea
              id="short-term-goal"
              minRows={3}
              value={draft.short_term_goal}
              onChange={(event) =>
                onChange("short_term_goal", event.target.value)
              }
            />
          </div>
          <div className="missionary-field">
            <label htmlFor="long-term-goal">Long-term goal</label>
            <AutoResizeTextarea
              id="long-term-goal"
              minRows={3}
              value={draft.long_term_goal}
              onChange={(event) =>
                onChange("long_term_goal", event.target.value)
              }
            />
          </div>
        </div>
      </MissionaryCard>

      <MissionaryCard density="compact">
        <SectionHeader title="Current language study plan" />
        <div className="missionary-field">
          <label htmlFor="current-study-plan" className="visually-hidden">
            Current language study plan
          </label>
          <AutoResizeTextarea
            id="current-study-plan"
            className="missionary-field-editor"
            minRows={5}
            value={draft.current_study_plan}
            onChange={(event) =>
              onChange("current_study_plan", event.target.value)
            }
            placeholder="Write the study plan here..."
          />
        </div>
      </MissionaryCard>

      <MissionaryCard density="medium">
        <SectionHeader title="Tutor notes" />
        <div className="missionary-field">
          <label htmlFor="tutor-notes" className="visually-hidden">
            Tutor notes
          </label>
          <AutoResizeTextarea
            id="tutor-notes"
            className="missionary-field-notes"
            minRows={3}
            value={draft.tutor_notes}
            onChange={(event) => onChange("tutor_notes", event.target.value)}
            placeholder="Add notes for yourself..."
          />
        </div>
      </MissionaryCard>

      <MetadataCard
        lastUpdatedAt={lastUpdatedAt}
        followUpDate={draft.follow_up_date}
        onFollowUpChange={(value) => onChange("follow_up_date", value)}
      />
    </div>
  );
}
