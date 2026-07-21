import type { TeacherViewMissionary } from "../../types/teacherView";

import { TeacherMissionaryCard } from "./TeacherMissionaryCard";

type TeacherMissionaryListProps = {
  missionaries: TeacherViewMissionary[];
};

export function TeacherMissionaryList({
  missionaries,
}: TeacherMissionaryListProps) {
  if (missionaries.length === 0) {
    return (
      <p className="teacher-view-empty">
        No missionaries are in this view yet.
      </p>
    );
  }

  return (
    <div className="teacher-missionary-list">
      {missionaries.map((missionary) => (
        <TeacherMissionaryCard key={missionary.id} missionary={missionary} />
      ))}
    </div>
  );
}
