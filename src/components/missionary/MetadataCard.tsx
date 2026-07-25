import { formatLastUpdated } from "../../utils/formatLastUpdated";
import { MissionaryCard } from "./MissionaryCard";
import { SectionHeader } from "./SectionHeader";

type MetadataCardProps = {
  lastUpdatedAt: string;
  followUpDate: string;
  onFollowUpChange: (value: string) => void;
};

/** Compact metadata card for last updated + follow-up date. */
export function MetadataCard({
  lastUpdatedAt,
  followUpDate,
  onFollowUpChange,
}: MetadataCardProps) {
  return (
    <MissionaryCard density="meta">
      <SectionHeader title="Details" />

      <div className="missionary-meta-grid">
        <div className="missionary-field missionary-field--readonly">
          <span className="missionary-field-label">Last updated</span>
          <p className="missionary-last-updated">
            {formatLastUpdated(lastUpdatedAt)}
          </p>
        </div>

        <div className="missionary-field">
          <label htmlFor="follow-up-date">Follow-up date</label>
          <input
            id="follow-up-date"
            type="date"
            value={followUpDate}
            onChange={(event) => onFollowUpChange(event.target.value)}
          />
        </div>
      </div>
    </MissionaryCard>
  );
}
