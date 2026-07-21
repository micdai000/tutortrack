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
        <h2>Districts</h2>
        <Link to="/districts" className="dashboard-card-link">
          Manage
        </Link>
      </div>

      {loading && <p className="dashboard-empty">Loading districts...</p>}

      {!loading && error && <p className="dashboard-error">{error}</p>}

      {!loading && !error && districts.length === 0 && (
        <p className="dashboard-empty">
          No districts yet.{" "}
          <Link to="/districts">Create your first district</Link>.
        </p>
      )}

      {!loading && !error && districts.length > 0 && (
        <ul className="dashboard-list">
          {districts.map((district) => (
            <li
              key={district.id}
              className="dashboard-list-item dashboard-list-item--clickable"
            >
              <p className="dashboard-item-title">{district.name}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
