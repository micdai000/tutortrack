import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "./AuthProvider";

/** Renders child routes when authenticated; otherwise redirects to login. */
export function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
