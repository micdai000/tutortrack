import type { District } from "../types/district";

type DistrictListProps = {
  districts: District[];
};

export function DistrictList({ districts }: DistrictListProps) {
  if (districts.length === 0) {
    return (
      <p className="districts-empty">
        You do not have any districts yet. Create your first district above.
      </p>
    );
  }

  return (
    <ul className="district-list">
      {districts.map((district) => (
        <li key={district.id} className="district-list-item">
          <p className="district-list-item-title">{district.name}</p>
        </li>
      ))}
    </ul>
  );
}
