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
  MissionariesInNeed,
  StatCard,
  TodaysFollowUps,
} from "../components/dashboard";
import { PageContainer } from "../components/layout";
import { useDashboardFollowUps } from "../hooks/useDashboardFollowUps";
import { useDashboardOverview } from "../hooks/useDashboardOverview";
import { useTodaysScheduledFollowUps } from "../hooks/useTodaysScheduledFollowUps";
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
    followUps: missionariesInNeed,
    loading: missionariesInNeedLoading,
    error: missionariesInNeedError,
  } = useDashboardFollowUps(effectiveDistrictId || null);

  const {
    followUps: scheduledFollowUps,
    loading: scheduledFollowUpsLoading,
    error: scheduledFollowUpsError,
    completionMessage,
    completingMissionaryId,
    markComplete,
  } = useTodaysScheduledFollowUps();

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
          label="Active follow-ups"
          value={scheduledFollowUps.length}
          icon={CalendarClock}
          loading={loading || scheduledFollowUpsLoading}
        />
      </section>

      <div className="dashboard-priority">
        <MissionariesInNeed
          districts={districts}
          districtId={effectiveDistrictId}
          followUps={missionariesInNeed}
          loading={missionariesInNeedLoading || loading}
          error={missionariesInNeedError}
          onDistrictChange={handleDistrictChange}
        />

        <TodaysFollowUps
          districts={districts}
          districtId={effectiveDistrictId}
          followUps={scheduledFollowUps}
          loading={scheduledFollowUpsLoading || loading}
          error={scheduledFollowUpsError}
          completionMessage={completionMessage}
          completingMissionaryId={completingMissionaryId}
          onDistrictChange={handleDistrictChange}
          onMarkComplete={markComplete}
        />
      </div>

      <DistrictGrid
        districts={filteredDistricts}
        loading={loading}
        error={error}
        emptyQuery={normalizedQuery.length > 0}
        query={query.trim()}
        searchValue={query}
        onSearchChange={setQuery}
      />
    </PageContainer>
  );
}

export default DashboardPage;
