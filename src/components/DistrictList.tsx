import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

import type { District } from "../types/district";

type DistrictListProps = {
  districts: District[];
  onRequestDelete: (district: District) => void;
};

export function DistrictList({
  districts,
  onRequestDelete,
}: DistrictListProps) {
  if (districts.length === 0) {
    return (
      <p className="districts-empty">
        No districts yet. Add one above to get started.
      </p>
    );
  }

  return (
    <ul className="district-list">
      {districts.map((district) => (
        <DistrictListItem
          key={district.id}
          district={district}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </ul>
  );
}

type DistrictListItemProps = {
  district: District;
  onRequestDelete: (district: District) => void;
};

function DistrictListItem({
  district,
  onRequestDelete,
}: DistrictListItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <li className="district-list-item">
      <div className="district-list-item-row">
        <Link
          to={`/districts/${district.id}`}
          className="district-list-item-link"
        >
          <span>{district.name}</span>
          <span className="district-list-item-action">Open →</span>
        </Link>

        <div className="district-menu" ref={menuRef}>
          <button
            type="button"
            className="district-menu-trigger"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={`Actions for ${district.name}`}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="district-menu-panel" role="menu" id={menuId}>
              <button
                type="button"
                role="menuitem"
                className="district-menu-item district-menu-item--danger"
                onClick={() => {
                  setMenuOpen(false);
                  onRequestDelete(district);
                }}
              >
                Delete district
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
