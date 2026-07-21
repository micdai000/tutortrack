import type { Missionary } from "./missionary";

export type Companionship = {
  id: string;
  district_id: string;
  created_at: string;
};

/** Companionship with its missionaries for district detail views. */
export type CompanionshipWithMissionaries = Companionship & {
  missionaries: Missionary[];
};

export type CompanionshipSize = 2 | 3;
