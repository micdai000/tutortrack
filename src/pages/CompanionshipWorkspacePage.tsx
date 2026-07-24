import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AddMissionaryForm } from "../components/AddMissionaryForm";
import { ConfirmDeleteCompanionshipDialog } from "../components/ConfirmDeleteCompanionshipDialog";
import { ConfirmRemoveMissionaryDialog } from "../components/ConfirmRemoveMissionaryDialog";
import { MissionarySelectList } from "../components/MissionarySelectList";
import { TeacherViewEntryActions } from "../components/teacher/TeacherViewEntryActions";
import { useCompanionshipWorkspace } from "../hooks/useCompanionshipWorkspace";
import type { Missionary } from "../types/missionary";
import { getErrorMessage } from "../utils/getErrorMessage";
import "../styles/companionship-workspace.css";

function CompanionshipWorkspacePage() {
  const navigate = useNavigate();
  const { companionshipId } = useParams<{ companionshipId: string }>();
  const {
    workspace,
    loading,
    error,
    addMissionary,
    renameMissionary,
    removeMissionary,
    deleteCurrentCompanionship,
  } = useCompanionshipWorkspace(companionshipId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [missionaryToRemove, setMissionaryToRemove] =
    useState<Missionary | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [showDeleteCompanionship, setShowDeleteCompanionship] = useState(false);
  const [deletingCompanionship, setDeletingCompanionship] = useState(false);
  const [deleteCompanionshipError, setDeleteCompanionshipError] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleConfirmRemove() {
    if (!missionaryToRemove) return;

    setRemoving(true);
    setRemoveError(null);

    try {
      const removedName = missionaryToRemove.display_name;
      await removeMissionary(missionaryToRemove);
      setMissionaryToRemove(null);
      setSuccessMessage(`“${removedName}” was removed from this companionship.`);
    } catch (err) {
      setRemoveError(
        getErrorMessage(err, "Unable to remove missionary. Please try again.")
      );
    } finally {
      setRemoving(false);
    }
  }

  async function handleConfirmDeleteCompanionship() {
    setDeletingCompanionship(true);
    setDeleteCompanionshipError(null);

    try {
      const districtId = await deleteCurrentCompanionship();
      void navigate(`/districts/${districtId}`, {
        replace: true,
        state: {
          successMessage: "Companionship was deleted.",
        },
      });
    } catch (err) {
      setDeleteCompanionshipError(
        getErrorMessage(
          err,
          "Unable to delete this companionship. Please try again."
        )
      );
      setDeletingCompanionship(false);
    }
  }

  return (
    <div className="companionship-workspace-page">
      {workspace && (
        <div className="companionship-workspace-back">
          <Link to={`/districts/${workspace.district.id}`}>
            ← Back to {workspace.district.name}
          </Link>
        </div>
      )}

      {loading && (
        <p className="companionship-workspace-status" role="status">
          Loading companionship...
        </p>
      )}

      {!loading && error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="companionship-workspace-success" role="status">
          {successMessage}
        </p>
      )}

      {!loading && workspace && companionshipId && (
        <>
          <section className="companionship-workspace-intro">
            <div className="companionship-workspace-intro-row">
              <div>
                <p className="companionship-workspace-district">
                  {workspace.district.name}
                </p>
                <h1>Companionship</h1>
                <p>
                  Select a missionary to review or update their language plan.
                </p>
              </div>

              <TeacherViewEntryActions
                openTo={`/teacher/companionship/${companionshipId}`}
                shareType="companionship"
                resourceId={companionshipId}
              />
            </div>
          </section>

          <section className="companionship-workspace-card">
            <div className="companionship-workspace-card-header">
              <h2 className="companionship-workspace-card-title">
                Missionaries
              </h2>
              {!showAddForm && (
                <button
                  type="button"
                  className="companionship-add-missionary-button"
                  onClick={() => {
                    setSuccessMessage(null);
                    setShowAddForm(true);
                  }}
                >
                  Add missionary
                </button>
              )}
            </div>

            {showAddForm && (
              <AddMissionaryForm
                onAdd={async (name) => {
                  await addMissionary(name);
                  setShowAddForm(false);
                  setSuccessMessage(`“${name.trim()}” was added.`);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            <MissionarySelectList
              missionaries={workspace.missionaries}
              onRename={async (missionary, name) => {
                setSuccessMessage(null);
                await renameMissionary(missionary, name);
                setSuccessMessage(`Name updated to “${name.trim()}”.`);
              }}
              onRequestRemove={(missionary) => {
                setSuccessMessage(null);
                setRemoveError(null);
                setMissionaryToRemove(missionary);
              }}
            />
          </section>

          <section className="companionship-danger-zone">
            <button
              type="button"
              className="companionship-delete-button"
              onClick={() => {
                setSuccessMessage(null);
                setDeleteCompanionshipError(null);
                setShowDeleteCompanionship(true);
              }}
            >
              Delete companionship
            </button>
          </section>
        </>
      )}

      {missionaryToRemove && (
        <ConfirmRemoveMissionaryDialog
          missionaryName={missionaryToRemove.display_name}
          submitting={removing}
          error={removeError}
          onCancel={() => {
            if (removing) return;
            setMissionaryToRemove(null);
            setRemoveError(null);
          }}
          onConfirm={() => {
            void handleConfirmRemove();
          }}
        />
      )}

      {showDeleteCompanionship && workspace && (
        <ConfirmDeleteCompanionshipDialog
          missionaryNames={workspace.missionaries.map(
            (missionary) => missionary.display_name
          )}
          submitting={deletingCompanionship}
          error={deleteCompanionshipError}
          onCancel={() => {
            if (deletingCompanionship) return;
            setShowDeleteCompanionship(false);
            setDeleteCompanionshipError(null);
          }}
          onConfirm={() => {
            void handleConfirmDeleteCompanionship();
          }}
        />
      )}
    </div>
  );
}

export default CompanionshipWorkspacePage;
