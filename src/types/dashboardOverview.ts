import type { District } from "./district";

/** District row enriched for dashboard cards (read-only display). */
export type DistrictSummary = District & {
  companionshipCount: number;
  missionaryCount: number;
};

export type DashboardStats = {
  districtCount: number;
  companionshipCount: number;
  missionaryCount: number;
  followUpCount: number;
};
