import { NavLink } from "react-router-dom";

import { useAuth } from "./AuthProvider";
import "../styles/app-header.css";

export function AppHeader() {
  const { signOut } = useAuth();

  return (
    <header className="app-header">
      <nav className="app-header-nav" aria-label="Primary">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/districts">Districts</NavLink>
      </nav>

      <button
        type="button"
        className="app-header-sign-out"
        onClick={() => void signOut()}
      >
        Sign out
      </button>
    </header>
  );
}
