import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";

import { ConfirmDeleteDistrictDialog } from "../components/ConfirmDeleteDistrictDialog";
import { CreateDistrictForm } from "../components/CreateDistrictForm";
import { DistrictList } from "../components/DistrictList";
import {
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
  StatusBanner,
} from "../components/layout";
import { useDistricts } from "../hooks/useDistricts";
import type { District } from "../types/district";
import { getErrorMessage } from "../utils/getErrorMessage";
import "../styles/districts.css";

function DistrictsPage() {
  const navigate = useNavigate();
  const { districts, loading, error, create, remove } = useDistricts();

  const [districtToDelete, setDistrictToDelete] = useState<District | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleConfirmDelete() {
    if (!districtToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const deletedName = districtToDelete.name;
      await remove(districtToDelete.id);
      setDistrictToDelete(null);
      setSuccessMessage(`“${deletedName}” was deleted.`);
      void navigate("/districts", { replace: true });
    } catch (err) {
      setDeleteError(
        getErrorMessage(
          err,
          "Unable to delete this district. Please try again."
        )
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageContainer className="districts-page">
      <PageHeader
        title="Districts"
        description="Organize your tutoring by district, then open one to manage companionships."
      />

      {successMessage && (
        <StatusBanner tone="success">{successMessage}</StatusBanner>
      )}

      <div className="tt-page-stack">
        <SectionCard title="Add a district">
          <CreateDistrictForm
            onCreate={async (name) => {
              setSuccessMessage(null);
              await create(name);
            }}
          />
        </SectionCard>

        <SectionCard title="Your districts">
          {loading && (
            <p className="districts-status" role="status">
              Loading districts...
            </p>
          )}
          {!loading && error && (
            <p className="tt-form-error" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && districts.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title="No districts yet"
              description="Add your first district above to start organizing companionships."
            />
          )}
          {!loading && !error && districts.length > 0 && (
            <DistrictList
              districts={districts}
              onRequestDelete={(district) => {
                setSuccessMessage(null);
                setDeleteError(null);
                setDistrictToDelete(district);
              }}
            />
          )}
        </SectionCard>
      </div>

      {districtToDelete && (
        <ConfirmDeleteDistrictDialog
          districtName={districtToDelete.name}
          submitting={deleting}
          error={deleteError}
          onCancel={() => {
            if (deleting) return;
            setDistrictToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={() => {
            void handleConfirmDelete();
          }}
        />
      )}
    </PageContainer>
  );
}

export default DistrictsPage;
