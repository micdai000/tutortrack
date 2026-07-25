import { Link, useParams } from "react-router-dom";

import { MissionaryProfileForm } from "../components/MissionaryProfileForm";
import { MissionaryHeader } from "../components/missionary";
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
    <div className="missionary-profile-page">
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
              <Link to={`/companionships/${missionary.companionship_id}`}>
                ← Back to companionship
              </Link>
            }
          />

          <MissionaryProfileForm
            draft={draft}
            lastUpdatedAt={missionary.last_updated_at}
            onChange={updateField}
          />
        </>
      )}
    </div>
  );
}

export default MissionaryProfilePage;
