import type { MissionarySaveStatus } from "../types/missionary";

type SaveStatusIndicatorProps = {
  status: MissionarySaveStatus;
  error: string | null;
};

export function SaveStatusIndicator({
  status,
  error,
}: SaveStatusIndicatorProps) {
  if (status === "error") {
    return (
      <p
        className="missionary-save-status missionary-save-status--error"
        role="alert"
      >
        {error ?? "Could not save. Keep editing — we will try again."}
      </p>
    );
  }

  if (status === "typing") {
    return (
      <p className="missionary-save-status" role="status">
        Typing...
      </p>
    );
  }

  if (status === "saving") {
    return (
      <p className="missionary-save-status" role="status">
        Saving...
      </p>
    );
  }

  if (status === "saved") {
    return (
      <p
        className="missionary-save-status missionary-save-status--saved"
        role="status"
      >
        Saved
      </p>
    );
  }

  return <p className="missionary-save-status">&nbsp;</p>;
}
