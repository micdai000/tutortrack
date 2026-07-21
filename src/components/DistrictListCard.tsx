import { Link } from "react-router-dom";

import type { District } from "../types/district";

type DistrictListCardProps = {
  districts: District[];
  loading?: boolean;
  error?: string | null;
};

export function DistrictListCard({
  districts,
  loading = false,
  error = null,
}: DistrictListCardProps) {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card-header">
        <h2>Your districts</h2>
        <Link to="/districts" className="dashboard-card-link">
          View all
        </Link>
      </div>

      {loading && (
        <p className="dashboard-empty" role="status">
          Loading districts...
        </p>
      )}

      {!loading && error && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && districts.length === 0 && (
        <p className="dashboard-empty">
          No districts yet.{" "}
          <Link to="/districts">Add your first district</Link>.
        </p>
      )}

      {!loading && !error && districts.length > 0 && (
        <ul className="dashboard-list">
          {districts.map((district) => (
            <li key={district.id} className="dashboard-list-item">
              <Link
                to={`/districts/${district.id}`}
                className="dashboard-item-link"
              >
                {district.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
