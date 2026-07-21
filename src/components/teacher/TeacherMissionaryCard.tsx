import type { TeacherViewMissionary } from "../../types/teacherView";

type TeacherMissionaryCardProps = {
  missionary: TeacherViewMissionary;
};

function displayText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not set yet";
}

/** Read-only missionary briefing card for Teacher Views. */
export function TeacherMissionaryCard({
  missionary,
}: TeacherMissionaryCardProps) {
  return (
    <article className="teacher-missionary-card">
      <h2 className="teacher-missionary-name">{missionary.display_name}</h2>

      <section className="teacher-missionary-section">
        <h3>Long-Term Goal</h3>
        <p>{displayText(missionary.long_term_goal)}</p>
      </section>

      <section className="teacher-missionary-section">
        <h3>Short-Term Goal</h3>
        <p>{displayText(missionary.short_term_goal)}</p>
      </section>

      <section className="teacher-missionary-section">
        <h3>Current Language Study Plan</h3>
        <p className="teacher-missionary-plan">
          {displayText(missionary.current_study_plan)}
        </p>
      </section>
    </article>
  );
}
