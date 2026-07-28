import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AuthConfirmedPage from "./pages/AuthConfirmedPage";
import DashboardPage from "./pages/DashboardPage";
import DistrictsPage from "./pages/DistrictsPage";
import DistrictDetailPage from "./pages/DistrictDetailPage";
import CompanionshipWorkspacePage from "./pages/CompanionshipWorkspacePage";
import CompanionshipTeacherViewPage from "./pages/CompanionshipTeacherViewPage";
import DistrictTeacherViewPage from "./pages/DistrictTeacherViewPage";
import SharedTeacherViewPage from "./pages/SharedTeacherViewPage";
import MissionaryProfilePage from "./pages/MissionaryProfilePage";
import RenderAccountPage from "./pages/RenderAccountPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/auth/confirmed",
    element: <AuthConfirmedPage />,
  },
  {
    path: "/share/:token",
    element: <SharedTeacherViewPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/districts",
            element: <DistrictsPage />,
          },
          {
            path: "/districts/:districtId",
            element: <DistrictDetailPage />,
          },
          {
            path: "/companionships/:companionshipId",
            element: <CompanionshipWorkspacePage />,
          },
          {
            path: "/missionaries/:missionaryId",
            element: <MissionaryProfilePage />,
          },
          {
            path: "/render-account",
            element: <RenderAccountPage />,
          },
          {
            path: "/settings",
            element: <SettingsPage />,
          },
        ],
      },
      // Document-style Teacher Views stay full-bleed (no shell chrome).
      {
        path: "/teacher/companionship/:companionshipId",
        element: <CompanionshipTeacherViewPage />,
      },
      {
        path: "/teacher/district/:districtId",
        element: <DistrictTeacherViewPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
