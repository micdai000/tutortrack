import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { Icon } from "./ui";
import { FloatingSidebar } from "./navigation/FloatingSidebar";
import "../styles/app-shell.css";

/**
 * Authenticated app chrome: floating sidebar + page outlet.
 * Page content is unchanged; only navigation lives here.
 */
export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="tt-app-shell">
      <FloatingSidebar
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <button
        type="button"
        className="tt-app-shell-menu"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen}
        aria-controls="tt-primary-sidebar"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <Icon icon={mobileOpen ? X : Menu} size="md" />
      </button>

      <div className="tt-app-shell-main">
        <Outlet />
      </div>
    </div>
  );
}
