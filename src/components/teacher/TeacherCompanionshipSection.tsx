import type { TeacherViewCompanionshipSection } from "../../types/teacherView";

import { TeacherMissionaryList } from "./TeacherMissionaryList";

type TeacherCompanionshipSectionProps = {
  section: TeacherViewCompanionshipSection;
};

/**
 * District Teacher View section: companionship heading, member names, cards.
 */
export function TeacherCompanionshipSection({
  section,
}: TeacherCompanionshipSectionProps) {
  const membersLabel =
    section.memberNames.length > 0
      ? section.memberNames.join(" · ")
      : "No missionaries yet";

  return (
    <section className="teacher-companionship-section">
      <header className="teacher-companionship-header">
        <h2 className="teacher-companionship-title">{section.title}</h2>
        <p className="teacher-companionship-members">{membersLabel}</p>
      </header>

      <TeacherMissionaryList missionaries={section.missionaries} />
    </section>
  );
}
