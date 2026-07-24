import { LogOut } from "lucide-react";

import { Icon } from "../ui";
import { cx } from "../ui/cx";

type SidebarFooterProps = {
  expanded: boolean;
  displayName: string;
  initials: string;
  onSignOut: () => void;
};

/** User identity + sign out at the bottom of the floating sidebar. */
export function SidebarFooter({
  expanded,
  displayName,
  initials,
  onSignOut,
}: SidebarFooterProps) {
  return (
    <div className="tt-sidebar-footer">
      <div className="tt-sidebar-user" title={displayName}>
        <span className="tt-sidebar-avatar" aria-hidden="true">
          {initials}
        </span>
        <span
          className={cx(
            "tt-sidebar-user-meta",
            expanded && "tt-sidebar-user-meta--visible"
          )}
        >
          <span className="tt-sidebar-user-name">{displayName}</span>
        </span>
      </div>

      <button
        type="button"
        className="tt-sidebar-item tt-sidebar-sign-out"
        onClick={onSignOut}
        aria-label="Sign out"
        title="Sign out"
      >
        <span className="tt-sidebar-item-icon">
          <Icon icon={LogOut} size="md" />
        </span>
        <span
          className={cx(
            "tt-sidebar-item-label",
            expanded && "tt-sidebar-item-label--visible"
          )}
        >
          Sign Out
        </span>
      </button>
    </div>
  );
}
