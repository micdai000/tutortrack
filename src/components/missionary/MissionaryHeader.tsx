import type { ReactNode } from "react";

import { AutoSaveBadge } from "./AutoSaveBadge";
import type { MissionarySaveStatus } from "../../types/missionary";

type MissionaryHeaderProps = {
  name: string;
  saveStatus: MissionarySaveStatus;
  saveError: string | null;
  backLink?: ReactNode;
};

/** Document-style header for the missionary language plan. */
export function MissionaryHeader({
  name,
  saveStatus,
  saveError,
  backLink,
}: MissionaryHeaderProps) {
  return (
    <header className="missionary-header">
      {backLink && <div className="missionary-header__back">{backLink}</div>}

      <div className="missionary-header__row">
        <div className="missionary-header__copy">
          <p className="missionary-header__kicker">Language plan</p>
          <h1 className="missionary-header__title">{name}</h1>
          <p className="missionary-header__support">
            Last updated automatically
          </p>
        </div>
        <AutoSaveBadge status={saveStatus} error={saveError} />
      </div>
    </header>
  );
}
