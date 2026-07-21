import { Link, useParams } from "react-router-dom";

import { CopyShareLinkButton } from "../components/teacher/CopyShareLinkButton";
import { TeacherViewDocument } from "../components/teacher/TeacherViewDocument";
import { useDistrictTeacherView } from "../hooks/useDistrictTeacherView";
import "../styles/teacher-view.css";

function DistrictTeacherViewPage() {
  const { districtId } = useParams<{ districtId: string }>();
  const { teacherView, loading, error } = useDistrictTeacherView(districtId);

  if (loading) {
    return (
      <div className="teacher-view">
        <p className="teacher-view-status" role="status">
          Preparing District Teacher View...
        </p>
      </div>
    );
  }

  if (error || !teacherView) {
    return (
      <div className="teacher-view">
        <p className="teacher-view-error" role="alert">
          {error ?? "Unable to load District Teacher View."}
        </p>
        {districtId && (
          <p className="teacher-view-status">
            <Link to={`/districts/${districtId}`}>← Back to district</Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <TeacherViewDocument
      teacherView={teacherView}
      toolbar={
        <CopyShareLinkButton shareType="district" resourceId={districtId} />
      }
    />
  );
}

export default DistrictTeacherViewPage;
