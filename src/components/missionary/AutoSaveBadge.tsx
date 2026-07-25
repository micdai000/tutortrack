import type { MissionarySaveStatus } from "../../types/missionary";
import { cx } from "../ui/cx";

type AutoSaveBadgeProps = {
  status: MissionarySaveStatus;
  error: string | null;
};

/** Subtle autosave status badge — presentation only. */
export function AutoSaveBadge({ status, error }: AutoSaveBadgeProps) {
  if (status === "error") {
    return (
      <span
        className="missionary-autosave missionary-autosave--error"
        role="alert"
      >
        <span className="missionary-autosave__dot" aria-hidden="true" />
        {error ?? "Could not save"}
      </span>
    );
  }

  if (status === "typing") {
    return (
      <span className="missionary-autosave" role="status">
        <span className="missionary-autosave__dot" aria-hidden="true" />
        Typing...
      </span>
    );
  }

  if (status === "saving") {
    return (
      <span
        className="missionary-autosave missionary-autosave--saving"
        role="status"
      >
        <span className="missionary-autosave__dot" aria-hidden="true" />
        Saving...
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span
        className={cx("missionary-autosave", "missionary-autosave--saved")}
        role="status"
      >
        <span className="missionary-autosave__dot" aria-hidden="true" />
        Saved
      </span>
    );
  }

  return (
    <span className="missionary-autosave missionary-autosave--idle" aria-hidden="true">
      <span className="missionary-autosave__dot" />
      Ready
    </span>
  );
}
