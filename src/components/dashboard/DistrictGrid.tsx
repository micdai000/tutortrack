import { Link } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";

import type { DistrictSummary } from "../../types/dashboardOverview";
import { EmptyState } from "../layout/EmptyState";
import { DistrictCard } from "./DistrictCard";

type DistrictGridProps = {
  districts: DistrictSummary[];
  loading?: boolean;
  error?: string | null;
  emptyQuery?: boolean;
  query?: string;
};

/** Responsive grid of district cards with loading / empty / error states. */
export function DistrictGrid({
  districts,
  loading = false,
  error = null,
  emptyQuery = false,
  query = "",
}: DistrictGridProps) {
  return (
    <section className="dashboard-districts" aria-labelledby="dashboard-districts-heading">
      <div className="dashboard-section-header">
        <h2 id="dashboard-districts-heading">Your districts</h2>
        <Link to="/districts" className="dashboard-section-link">
          View all
        </Link>
      </div>

      {loading && (
        <p className="dashboard-status" role="status">
          Loading districts...
        </p>
      )}

      {!loading && error && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && districts.length === 0 && emptyQuery && (
        <EmptyState
          icon={Search}
          title="No matching districts"
          description={`No districts match “${query}”.`}
        />
      )}

      {!loading && !error && districts.length === 0 && !emptyQuery && (
        <EmptyState
          icon={BookOpen}
          title="No districts yet"
          description="Add your first district to start organizing companionships."
          action={
            <Link to="/districts" className="tt-button tt-button--primary tt-button--sm">
              Add district
            </Link>
          }
        />
      )}

      {!loading && !error && districts.length > 0 && (
        <div className="dashboard-district-grid">
          {districts.map((district) => (
            <DistrictCard key={district.id} district={district} />
          ))}
        </div>
      )}
    </section>
  );
}
