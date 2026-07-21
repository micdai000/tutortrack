import { Link, useParams } from "react-router-dom";

import { CopyShareLinkButton } from "../components/teacher/CopyShareLinkButton";
import { TeacherViewDocument } from "../components/teacher/TeacherViewDocument";
import { useCompanionshipTeacherView } from "../hooks/useCompanionshipTeacherView";
import "../styles/teacher-view.css";

function CompanionshipTeacherViewPage() {
  const { companionshipId } = useParams<{ companionshipId: string }>();
  const { teacherView, loading, error } =
    useCompanionshipTeacherView(companionshipId);

  if (loading) {
    return (
      <div className="teacher-view">
        <p className="teacher-view-status" role="status">
          Preparing Teacher View...
        </p>
      </div>
    );
  }

  if (error || !teacherView) {
    return (
      <div className="teacher-view">
        <p className="teacher-view-error" role="alert">
          {error ?? "Unable to load Teacher View."}
        </p>
        {companionshipId && (
          <p className="teacher-view-status">
            <Link to={`/companionships/${companionshipId}`}>
              ← Back to companionship
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <TeacherViewDocument
      teacherView={teacherView}
      toolbar={
        <CopyShareLinkButton
          shareType="companionship"
          resourceId={companionshipId}
        />
      }
    />
  );
}

export default CompanionshipTeacherViewPage;
