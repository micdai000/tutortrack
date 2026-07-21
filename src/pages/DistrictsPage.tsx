import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppHeader } from "../components/AppHeader";
import { ConfirmDeleteDistrictDialog } from "../components/ConfirmDeleteDistrictDialog";
import { CreateDistrictForm } from "../components/CreateDistrictForm";
import { DistrictList } from "../components/DistrictList";
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
    <div className="districts-page">
      <AppHeader />

      <section className="districts-intro">
        <h1>Districts</h1>
        <p>
          Organize your tutoring by district, then open one to manage
          companionships.
        </p>
      </section>

      {successMessage && (
        <p className="districts-success" role="status">
          {successMessage}
        </p>
      )}

      <section className="districts-card">
        <h2>Add a district</h2>
        <CreateDistrictForm
          onCreate={async (name) => {
            setSuccessMessage(null);
            await create(name);
          }}
        />
      </section>

      <section className="districts-card">
        <h2>Your districts</h2>

        {loading && (
          <p className="districts-status" role="status">
            Loading districts...
          </p>
        )}
        {!loading && error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && (
          <DistrictList
            districts={districts}
            onRequestDelete={(district) => {
              setSuccessMessage(null);
              setDeleteError(null);
              setDistrictToDelete(district);
            }}
          />
        )}
      </section>

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
    </div>
  );
}

export default DistrictsPage;
