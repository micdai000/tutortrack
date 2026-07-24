import { NavLink } from "react-router-dom";

import { Icon } from "../ui";
import { cx } from "../ui/cx";
import type { SidebarNavItem } from "./navItems";

type SidebarItemProps = {
  item: SidebarNavItem;
  expanded: boolean;
  active: boolean;
  onNavigate?: () => void;
};

/** Single sidebar destination — icon always visible; label fades when expanded. */
export function SidebarItem({
  item,
  expanded,
  active,
  onNavigate,
}: SidebarItemProps) {
  const content = (
    <>
      <span className="tt-sidebar-item-icon">
        <Icon icon={item.icon} size="md" />
      </span>
      <span
        className={cx(
          "tt-sidebar-item-label",
          expanded && "tt-sidebar-item-label--visible"
        )}
      >
        {item.label}
      </span>
    </>
  );

  if (item.disabled) {
    return (
      <button
        type="button"
        className="tt-sidebar-item tt-sidebar-item--disabled"
        disabled
        title={item.title ?? item.label}
        aria-label={item.label}
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={item.title ?? item.label}
      aria-label={item.label}
      onClick={onNavigate}
      className={() =>
        cx("tt-sidebar-item", active && "tt-sidebar-item--active")
      }
    >
      {content}
    </NavLink>
  );
}
