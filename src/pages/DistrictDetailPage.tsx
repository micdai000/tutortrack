import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { User, Users } from "lucide-react";

import { CreateCompanionshipForm } from "../components/CreateCompanionshipForm";
import {
  CompanionshipGrid,
  DistrictActionBar,
  DistrictHeader,
  DistrictSummaryCard,
  SearchBar,
  companionshipLabel,
} from "../components/district";
import {
  BackLink,
  PageContainer,
  StatusBanner,
} from "../components/layout";
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
  const [query, setQuery] = useState("");

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

  function openAddCompanionshipForm() {
    setShowForm(true);
  }

  const missionaryCount = companionships.reduce(
    (total, companionship) => total + companionship.missionaries.length,
    0
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCompanionships =
    normalizedQuery.length === 0
      ? companionships
      : companionships.filter((companionship) =>
          companionshipLabel(companionship)
            .toLowerCase()
            .includes(normalizedQuery)
        );

  return (
    <PageContainer className="district-detail-page">
      <BackLink to="/districts">← Back to districts</BackLink>

      {loading && (
        <p className="district-status" role="status">
          Loading district...
        </p>
      )}

      {!loading && error && !district && (
        <p className="district-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <StatusBanner tone="success">{successMessage}</StatusBanner>
      )}

      {!loading && district && districtId && (
        <>
          <DistrictHeader
            name={district.name}
            actions={
              <TeacherViewEntryActions
                openTo={`/teacher/district/${districtId}`}
                shareType="district"
                resourceId={districtId}
              />
            }
          />

          <DistrictActionBar
            onAddCompanionship={openAddCompanionshipForm}
            showAddCompanionship={!showForm}
          />

          <section
            className="district-summary-row"
            aria-label="District summary"
          >
            <DistrictSummaryCard
              label="Companionships"
              value={companionships.length}
              icon={Users}
            />
            <DistrictSummaryCard
              label="Missionaries"
              value={missionaryCount}
              icon={User}
            />
          </section>

          <section
            className="district-companionships"
            aria-labelledby="district-companionships-heading"
          >
            <div className="district-section-header">
              <h2 id="district-companionships-heading">Companionships</h2>
            </div>

            {showForm && (
              <CreateCompanionshipForm
                onCreate={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            )}

            {error && (
              <p className="district-error" role="alert">
                {error}
              </p>
            )}

            {companionships.length > 0 && (
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search companionships..."
              />
            )}

            <CompanionshipGrid
              companionships={filteredCompanionships}
              emptyQuery={normalizedQuery.length > 0}
              query={query.trim()}
              onAddCompanionship={openAddCompanionshipForm}
              showEmptyAddAction={!showForm}
            />
          </section>
        </>
      )}
    </PageContainer>
  );
}

export default DistrictDetailPage;
