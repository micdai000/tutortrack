import type { LucideIcon } from "lucide-react";
import { BookOpen, LayoutDashboard, Settings } from "lucide-react";

export type SidebarNavItem = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Path prefixes that mark this item active. */
  matchPrefixes: string[];
  /** Exact path match only (optional). */
  end?: boolean;
  disabled?: boolean;
  title?: string;
};

/**
 * Primary app navigation — intentionally minimal.
 * Future pages plug in by adding an entry here and a route under AppShell.
 */
export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    matchPrefixes: ["/dashboard"],
    end: true,
  },
  {
    id: "districts",
    label: "Districts",
    to: "/districts",
    icon: BookOpen,
    matchPrefixes: ["/districts", "/companionships", "/missionaries"],
  },
  {
    id: "settings",
    label: "Settings",
    to: "/settings",
    icon: Settings,
    matchPrefixes: ["/settings"],
  },
];

export function isNavItemActive(
  item: SidebarNavItem,
  pathname: string
): boolean {
  if (item.disabled || item.matchPrefixes.length === 0) {
    return false;
  }

  return item.matchPrefixes.some((prefix) => {
    if (item.end) {
      return pathname === prefix;
    }
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}
