import { useParams } from "react-router-dom";

import { MissionaryProfileForm } from "../components/MissionaryProfileForm";
import { MissionaryHeader } from "../components/missionary";
import { BackLink, PageContainer } from "../components/layout";
import { useMissionaryProfile } from "../hooks/useMissionaryProfile";
import "../styles/missionary-profile.css";

function MissionaryProfilePage() {
  const { missionaryId } = useParams<{ missionaryId: string }>();
  const {
    missionary,
    draft,
    loading,
    loadError,
    saveStatus,
    saveError,
    updateField,
  } = useMissionaryProfile(missionaryId);

  const pageTitle =
    draft?.display_name.trim() || missionary?.display_name || "Missionary";

  return (
    <PageContainer className="missionary-profile-page">
      {loading && (
        <p className="missionary-profile-status" role="status">
          Loading language plan...
        </p>
      )}

      {!loading && loadError && (
        <p className="missionary-profile-error" role="alert">
          {loadError}
        </p>
      )}

      {!loading && missionary && draft && (
        <>
          <MissionaryHeader
            name={pageTitle}
            saveStatus={saveStatus}
            saveError={saveError}
            backLink={
              <BackLink to={`/companionships/${missionary.companionship_id}`}>
                ← Back to companionship
              </BackLink>
            }
          />

          <MissionaryProfileForm
            draft={draft}
            lastUpdatedAt={missionary.last_updated_at}
            onChange={updateField}
          />
        </>
      )}
    </PageContainer>
  );
}

export default MissionaryProfilePage;
