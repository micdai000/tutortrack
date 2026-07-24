import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

import { Icon } from "./ui";
import { FloatingSidebar } from "./navigation/FloatingSidebar";
import "../styles/app-shell.css";

/**
 * Authenticated app chrome: floating sidebar + page outlet.
 * Page content is unchanged; only navigation lives here.
 */
export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="tt-app-shell">
      <FloatingSidebar
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <button
        type="button"
        className="tt-app-shell-menu"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
      >
        <Icon icon={Menu} size="md" />
      </button>

      <div className="tt-app-shell-main">
        <Outlet />
      </div>
    </div>
  );
}
