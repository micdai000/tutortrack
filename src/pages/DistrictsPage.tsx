import { AppHeader } from "../components/AppHeader";
import { CreateDistrictForm } from "../components/CreateDistrictForm";
import { DistrictList } from "../components/DistrictList";
import { useDistricts } from "../hooks/useDistricts";
import "../styles/districts.css";

function DistrictsPage() {
  const { districts, loading, error, create } = useDistricts();

  return (
    <div className="districts-page">
      <AppHeader />

      <section className="districts-intro">
        <h1>Districts</h1>
        <p>Create and manage the districts you tutor.</p>
      </section>

      <section className="districts-card">
        <h2>Create district</h2>
        <CreateDistrictForm onCreate={create} />
      </section>

      <section className="districts-card">
        <h2>Your districts</h2>

        {loading && <p className="districts-status">Loading districts...</p>}
        {!loading && error && <p className="form-error">{error}</p>}
        {!loading && !error && <DistrictList districts={districts} />}
      </section>
    </div>
  );
}

export default DistrictsPage;
