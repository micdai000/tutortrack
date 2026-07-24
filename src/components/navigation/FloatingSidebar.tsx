import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../AuthProvider";
import { getDisplayFirstName } from "../../utils/greeting";
import { getUserInitials } from "../../utils/userIdentity";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarItem } from "./SidebarItem";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarToggle } from "./SidebarToggle";
import { isNavItemActive, SIDEBAR_NAV_ITEMS } from "./navItems";
import { cx } from "../ui/cx";
import "../../styles/floating-sidebar.css";

const MOBILE_QUERY = "(max-width: 768px)";

type FloatingSidebarProps = {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

/**
 * Floating pill navigation.
 * Desktop: hover expands; toggle pins expanded.
 * Mobile: controlled drawer via mobileOpen.
 */
export function FloatingSidebar({
  mobileOpen,
  onMobileOpenChange,
}: FloatingSidebarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(MOBILE_QUERY).matches
      : false
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    function onChange() {
      setIsMobile(media.matches);
      if (!media.matches) {
        onMobileOpenChange(false);
      }
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [onMobileOpenChange]);

  const expanded = isMobile ? mobileOpen : pinned || hovered;
  const displayName = getDisplayFirstName(user);
  const initials = getUserInitials(user);

  return (
    <>
      {isMobile && mobileOpen && (
        <button
          type="button"
          className="tt-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => onMobileOpenChange(false)}
        />
      )}

      <aside
        className={cx(
          "tt-sidebar",
          expanded && "tt-sidebar--expanded",
          isMobile && "tt-sidebar--mobile",
          isMobile && mobileOpen && "tt-sidebar--mobile-open"
        )}
        aria-label="Primary"
        onMouseEnter={() => {
          if (!isMobile) setHovered(true);
        }}
        onMouseLeave={() => {
          if (!isMobile) setHovered(false);
        }}
      >
        <div className="tt-sidebar-top">
          <SidebarLogo expanded={expanded} />
          {!isMobile && expanded && (
            <SidebarToggle
              expanded={pinned}
              onToggle={() => setPinned((current) => !current)}
            />
          )}
        </div>

        <nav className="tt-sidebar-nav">
          {SIDEBAR_NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              expanded={expanded}
              active={isNavItemActive(item, location.pathname)}
              onNavigate={() => {
                if (isMobile) onMobileOpenChange(false);
              }}
            />
          ))}
        </nav>

        <div className="tt-sidebar-spacer" aria-hidden="true" />

        <SidebarFooter
          expanded={expanded}
          displayName={displayName}
          initials={initials}
          onSignOut={() => {
            void signOut();
          }}
        />
      </aside>
    </>
  );
}
