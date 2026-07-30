import { useState } from "react";
import {
  CalendarClock,
  LayoutDashboard,
  UserRound,
  Users,
} from "lucide-react";

import { useAuth } from "../components/AuthProvider";
import {
  DashboardHeader,
  DistrictGrid,
  SearchBar,
  StatCard,
  TodaysFollowUps,
} from "../components/dashboard";
import { PageContainer } from "../components/layout";
import { useDashboardFollowUps } from "../hooks/useDashboardFollowUps";
import { useDashboardOverview } from "../hooks/useDashboardOverview";
import { getDisplayFirstName, getTimeOfDayGreeting } from "../utils/greeting";
import "../styles/dashboard.css";

const DISTRICT_STORAGE_KEY = "tutortrack.dashboard.districtId";

function readStoredDistrictId(): string | null {
  try {
    return sessionStorage.getItem(DISTRICT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredDistrictId(districtId: string) {
  try {
    sessionStorage.setItem(DISTRICT_STORAGE_KEY, districtId);
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

function DashboardPage() {
  const { user } = useAuth();
  const { districts, stats, loading, error } = useDashboardOverview();
  const [query, setQuery] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    () => readStoredDistrictId()
  );

  const storedDistrictId = readStoredDistrictId();
  const effectiveDistrictId =
    selectedDistrictId &&
    districts.some((district) => district.id === selectedDistrictId)
      ? selectedDistrictId
      : storedDistrictId &&
          districts.some((district) => district.id === storedDistrictId)
        ? storedDistrictId
        : (districts[0]?.id ?? "");

  const {
    followUps,
    loading: followUpsLoading,
    error: followUpsError,
  } = useDashboardFollowUps(effectiveDistrictId || null);

  function handleDistrictChange(districtId: string) {
    setSelectedDistrictId(districtId);
    writeStoredDistrictId(districtId);
  }

  const greeting = getTimeOfDayGreeting();
  const firstName = getDisplayFirstName(user);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredDistricts =
    normalizedQuery.length === 0
      ? districts
      : districts.filter((district) =>
          district.name.toLowerCase().includes(normalizedQuery)
        );

  return (
    <PageContainer className="dashboard-page">
      <DashboardHeader greeting={greeting} firstName={firstName} />

      <section className="dashboard-stats" aria-label="Workspace overview">
        <StatCard
          label="Districts"
          value={stats.districtCount}
          icon={LayoutDashboard}
          loading={loading}
        />
        <StatCard
          label="Companionships"
          value={stats.companionshipCount}
          icon={Users}
          loading={loading}
        />
        <StatCard
          label="Missionaries"
          value={stats.missionaryCount}
          icon={UserRound}
          loading={loading}
        />
        <StatCard
          label="Follow-ups today"
          value={followUps.length}
          icon={CalendarClock}
          loading={loading || followUpsLoading}
        />
      </section>

      <div className="dashboard-main">
        {districts.length > 0 && (
          <TodaysFollowUps
            districts={districts}
            districtId={effectiveDistrictId}
            followUps={followUps}
            loading={followUpsLoading || loading}
            error={followUpsError}
            onDistrictChange={handleDistrictChange}
          />
        )}

        <div className="dashboard-districts-panel">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search districts…"
            label="Search districts"
          />
          <DistrictGrid
            districts={filteredDistricts}
            loading={loading}
            error={error}
            emptyQuery={normalizedQuery.length > 0}
            query={query.trim()}
          />
        </div>
      </div>
    </PageContainer>
  );
}

export default DashboardPage;
