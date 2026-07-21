import type { Missionary } from "../types/missionary";

import { MissionarySelectCard } from "./MissionarySelectCard";

type MissionarySelectListProps = {
  missionaries: Missionary[];
  onRename: (missionary: Missionary, name: string) => Promise<void>;
  onRequestRemove: (missionary: Missionary) => void;
};

export function MissionarySelectList({
  missionaries,
  onRename,
  onRequestRemove,
}: MissionarySelectListProps) {
  if (missionaries.length === 0) {
    return (
      <p className="companionship-workspace-empty">
        No missionaries here yet. Add a missionary to get started.
      </p>
    );
  }

  const canRemove = missionaries.length > 2;

  return (
    <div className="missionary-select-list">
      {missionaries.map((missionary) => (
        <MissionarySelectCard
          key={missionary.id}
          missionary={missionary}
          canRemove={canRemove}
          onRename={onRename}
          onRequestRemove={onRequestRemove}
        />
      ))}
      {!canRemove && (
        <p className="companionship-workspace-hint">
          A companionship must contain at least two missionaries. To remove
          someone from a duo, delete the companionship instead.
        </p>
      )}
    </div>
  );
}
