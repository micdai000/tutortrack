import { StatusBadge } from "../layout";
import { formatLastUpdated } from "../../utils/formatLastUpdated";
import { resolveFollowUpStatus } from "../../utils/followUpStatus";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { MissionaryCard } from "./MissionaryCard";
import { SectionHeader } from "./SectionHeader";

type MetadataCardProps = {
  lastUpdatedAt: string;
  followUpDate: string;
  followUpNotes: string;
  onFollowUpChange: (value: string) => void;
  onFollowUpNotesChange: (value: string) => void;
};

/** Follow-up scheduling card: status badge, date, and notes (auto-saved by parent). */
export function MetadataCard({
  lastUpdatedAt,
  followUpDate,
  followUpNotes,
  onFollowUpChange,
  onFollowUpNotesChange,
}: MetadataCardProps) {
  const status = resolveFollowUpStatus(followUpDate || null);

  return (
    <MissionaryCard density="meta">
      <SectionHeader title="Follow-up" />

      <div className="missionary-follow-up">
        <div className="missionary-field missionary-field--readonly">
          <span className="missionary-field-label">Status</span>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        </div>

        <div className="missionary-field">
          <label htmlFor="follow-up-date">Follow-up Date</label>
          <input
            id="follow-up-date"
            type="date"
            value={followUpDate}
            onChange={(event) => onFollowUpChange(event.target.value)}
          />
        </div>

        <div className="missionary-field">
          <label htmlFor="follow-up-notes">Follow-up Notes</label>
          <AutoResizeTextarea
            id="follow-up-notes"
            className="missionary-field-notes"
            minRows={4}
            value={followUpNotes}
            onChange={(event) => onFollowUpNotesChange(event.target.value)}
            placeholder="Add notes to remind yourself why you wanted to follow up with this missionary..."
          />
        </div>

        <p className="missionary-follow-up__updated">
          Last updated {formatLastUpdated(lastUpdatedAt)}
        </p>
      </div>
    </MissionaryCard>
  );
}
