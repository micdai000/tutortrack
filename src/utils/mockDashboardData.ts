import type { FollowUpItem } from "../types/dashboard";

/** Temporary mock data until follow-ups are wired to Supabase. */
export const mockFollowUps: FollowUpItem[] = [
  {
    id: "1",
    missionaryName: "Elder John Smith",
    districtName: "14-Q",
    followUpLabel: "Today",
  },
  {
    id: "2",
    missionaryName: "Sister Maria Lopez",
    districtName: "15-R",
    followUpLabel: "Today",
  },
  {
    id: "3",
    missionaryName: "Elder David Chen",
    districtName: "16-A",
    followUpLabel: "Today",
  },
];
