import type { TeacherViewContext } from "../../types/teacherView";

type TeacherViewHeaderProps = {
  context: TeacherViewContext;
};

/** Shared document header for companionship and district Teacher Views. */
export function TeacherViewHeader({ context }: TeacherViewHeaderProps) {
  return (
    <header className="teacher-view-header">
      <p className="teacher-view-kicker">{context.documentTitle}</p>
      <h1 className="teacher-view-district">{context.districtName}</h1>
      {context.scopeLabel && (
        <p className="teacher-view-scope">{context.scopeLabel}</p>
      )}
    </header>
  );
}
