import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users } from "lucide-react";

import { AddMissionaryForm } from "../components/AddMissionaryForm";
import { ConfirmDeleteCompanionshipDialog } from "../components/ConfirmDeleteCompanionshipDialog";
import { ConfirmRemoveMissionaryDialog } from "../components/ConfirmRemoveMissionaryDialog";
import { MissionarySelectList } from "../components/MissionarySelectList";
import { TeacherViewEntryActions } from "../components/teacher/TeacherViewEntryActions";
import {
  BackLink,
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
  StatusBanner,
} from "../components/layout";
import { Button } from "../components/ui";
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
    <PageContainer className="companionship-workspace-page">
      {workspace && (
        <BackLink to={`/districts/${workspace.district.id}`}>
          ← Back to {workspace.district.name}
        </BackLink>
      )}

      {loading && (
        <p className="companionship-workspace-status" role="status">
          Loading companionship...
        </p>
      )}

      {!loading && error && (
        <p className="tt-form-error" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <StatusBanner tone="success">{successMessage}</StatusBanner>
      )}

      {!loading && workspace && companionshipId && (
        <div className="tt-page-stack">
          <PageHeader
            kicker={workspace.district.name}
            title="Companionship"
            description="Select a missionary to review or update their language plan."
            actions={
              <TeacherViewEntryActions
                openTo={`/teacher/companionship/${companionshipId}`}
                shareType="companionship"
                resourceId={companionshipId}
              />
            }
          />

          <SectionCard
            title="Missionaries"
            actions={
              !showAddForm ? (
                <Button
                  type="button"
                  onClick={() => {
                    setSuccessMessage(null);
                    setShowAddForm(true);
                  }}
                >
                  Add missionary
                </Button>
              ) : undefined
            }
          >
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

            {workspace.missionaries.length === 0 && !showAddForm ? (
              <EmptyState
                icon={Users}
                title="No missionaries yet"
                description="Add a missionary to start building their language plan."
                action={
                  <Button
                    type="button"
                    onClick={() => {
                      setSuccessMessage(null);
                      setShowAddForm(true);
                    }}
                  >
                    Add missionary
                  </Button>
                }
              />
            ) : (
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
            )}
          </SectionCard>

          <section className="companionship-danger-zone">
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setSuccessMessage(null);
                setDeleteCompanionshipError(null);
                setShowDeleteCompanionship(true);
              }}
            >
              Delete companionship
            </Button>
          </section>
        </div>
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
    </PageContainer>
  );
}

export default CompanionshipWorkspacePage;
