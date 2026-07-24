import type { TeacherViewContext } from "../../types/teacherView";
import { Brand } from "../branding";

type TeacherViewHeaderProps = {
  context: TeacherViewContext;
};

function formatLetterheadDate(date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Shared document header for companionship and district Teacher Views. */
export function TeacherViewHeader({ context }: TeacherViewHeaderProps) {
  return (
    <header className="teacher-view-header">
      <div className="teacher-view-letterhead">
        <Brand size="print" tone="mono" />
        <p className="teacher-view-letterhead-date">{formatLetterheadDate()}</p>
      </div>
      <p className="teacher-view-kicker">{context.documentTitle}</p>
      <h1 className="teacher-view-district">{context.districtName}</h1>
      {context.scopeLabel && (
        <p className="teacher-view-scope">{context.scopeLabel}</p>
      )}
    </header>
  );
}
