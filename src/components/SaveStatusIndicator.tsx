import type { MissionarySaveStatus } from "../types/missionary";
import { AutoSaveBadge } from "./missionary/AutoSaveBadge";

type SaveStatusIndicatorProps = {
  status: MissionarySaveStatus;
  error: string | null;
};

/** Thin wrapper around AutoSaveBadge for existing call sites. */
export function SaveStatusIndicator({
  status,
  error,
}: SaveStatusIndicatorProps) {
  return <AutoSaveBadge status={status} error={error} />;
}
