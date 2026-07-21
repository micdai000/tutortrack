import { useParams } from "react-router-dom";

import { TeacherViewDocument } from "../components/teacher/TeacherViewDocument";
import { useSharedTeacherView } from "../hooks/useSharedTeacherView";
import "../styles/teacher-view.css";

function SharedTeacherViewPage() {
  const { token } = useParams<{ token: string }>();
  const { teacherView, loading, unavailable, error } =
    useSharedTeacherView(token);

  if (loading) {
    return (
      <div className="teacher-view">
        <p className="teacher-view-status" role="status">
          Opening shared Teacher View...
        </p>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="teacher-view teacher-view-unavailable">
        <h1 className="teacher-view-unavailable-title">
          This link is no longer available.
        </h1>
        <p className="teacher-view-unavailable-body">
          The share link may be invalid or revoked. Ask the tutor for a new
          link if you still need access.
        </p>
      </div>
    );
  }

  if (error || !teacherView) {
    return (
      <div className="teacher-view">
        <p className="teacher-view-error" role="alert">
          {error ?? "Unable to open this shared Teacher View."}
        </p>
      </div>
    );
  }

  return <TeacherViewDocument teacherView={teacherView} showBackLink={false} />;
}

export default SharedTeacherViewPage;
