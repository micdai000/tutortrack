import { Link, useParams } from "react-router-dom";

import { AppHeader } from "../components/AppHeader";
import { MissionaryProfileForm } from "../components/MissionaryProfileForm";
import { SaveStatusIndicator } from "../components/SaveStatusIndicator";
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
      <AppHeader />

      {missionary && (
        <div className="missionary-profile-back">
          <Link to={`/companionships/${missionary.companionship_id}`}>
            ← Back to companionship
          </Link>
        </div>
      )}

      {loading && (
        <p className="missionary-profile-status" role="status">
          Loading language plan...
        </p>
      )}

      {!loading && loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}

      {!loading && missionary && draft && (
        <>
          <div className="missionary-profile-toolbar">
            <div>
              <p className="missionary-profile-kicker">Language plan</p>
              <h1 className="missionary-profile-title">{pageTitle}</h1>
            </div>
            <SaveStatusIndicator status={saveStatus} error={saveError} />
          </div>

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
