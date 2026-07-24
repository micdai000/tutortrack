import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { CompanionshipList } from "../components/CompanionshipList";
import { CreateCompanionshipForm } from "../components/CreateCompanionshipForm";
import { TeacherViewEntryActions } from "../components/teacher/TeacherViewEntryActions";
import { useDistrictDetail } from "../hooks/useDistrictDetail";
import "../styles/district-detail.css";

type DistrictDetailLocationState = {
  successMessage?: string;
};

function DistrictDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { districtId } = useParams<{ districtId: string }>();
  const {
    district,
    companionships,
    loading,
    error,
    createCompanionship,
  } = useDistrictDetail(districtId);

  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as DistrictDetailLocationState | null;
    if (!state?.successMessage) return;

    setSuccessMessage(state.successMessage);
    void navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  async function handleCreate(missionaryNames: string[]) {
    setSuccessMessage(null);
    await createCompanionship(missionaryNames);
    setShowForm(false);
  }

  return (
    <div className="district-detail-page">
      <div className="district-detail-back">
        <Link to="/districts">← Back to districts</Link>
      </div>

      {loading && (
        <p className="district-detail-status" role="status">
          Loading district...
        </p>
      )}

      {!loading && error && !district && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="district-detail-success" role="status">
          {successMessage}
        </p>
      )}

      {!loading && district && (
        <>
          <section className="district-detail-intro">
            <div className="district-detail-intro-row">
              <div>
                <h1>{district.name}</h1>
                <p>
                  Open a companionship to choose which missionary you are
                  tutoring.
                </p>
              </div>

              {districtId && (
                <TeacherViewEntryActions
                  openTo={`/teacher/district/${districtId}`}
                  shareType="district"
                  resourceId={districtId}
                />
              )}
            </div>
          </section>

          <section className="district-detail-card">
            <div className="district-detail-card-header">
              <h2>Companionships</h2>
              {!showForm && (
                <button
                  type="button"
                  className="district-detail-primary-button"
                  onClick={() => setShowForm(true)}
                >
                  Add companionship
                </button>
              )}
            </div>

            {showForm && (
              <CreateCompanionshipForm
                onCreate={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            )}

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <CompanionshipList companionships={companionships} />
          </section>
        </>
      )}
    </div>
  );
}

export default DistrictDetailPage;
