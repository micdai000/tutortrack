import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Icon } from "../ui";

type SidebarToggleProps = {
  expanded: boolean;
  onToggle: () => void;
};

/** Pins the sidebar open/closed independent of hover. */
export function SidebarToggle({ expanded, onToggle }: SidebarToggleProps) {
  return (
    <button
      type="button"
      className="tt-sidebar-toggle"
      onClick={onToggle}
      aria-pressed={expanded}
      aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      title={expanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      <Icon icon={expanded ? PanelLeftClose : PanelLeftOpen} size="md" />
    </button>
  );
}
