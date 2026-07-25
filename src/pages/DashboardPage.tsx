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
  FollowUpCard,
  SearchBar,
  StatCard,
} from "../components/dashboard";
import { PageContainer } from "../components/layout";
import { useDashboardOverview } from "../hooks/useDashboardOverview";
import { getDisplayFirstName, getTimeOfDayGreeting } from "../utils/greeting";
import "../styles/dashboard.css";

function DashboardPage() {
  const { user } = useAuth();
  const { districts, stats, followUps, loading, error } =
    useDashboardOverview();
  const [query, setQuery] = useState("");

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
          label="Plans needing follow-up"
          value={stats.followUpCount}
          icon={CalendarClock}
          loading={loading}
        />
      </section>

      <div className="dashboard-main">
        <FollowUpCard followUps={followUps} />

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
