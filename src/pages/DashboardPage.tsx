import { AppHeader } from "../components/AppHeader";
import { WelcomeSection } from "../components/WelcomeSection";
import { FollowUpsCard } from "../components/FollowUpsCard";
import { DistrictListCard } from "../components/DistrictListCard";
import { useAuth } from "../components/AuthProvider";
import { useDistricts } from "../hooks/useDistricts";
import { getDisplayFirstName, getTimeOfDayGreeting } from "../utils/greeting";
import "../styles/dashboard.css";

function DashboardPage() {
  const { user } = useAuth();
  const { districts, loading, error } = useDistricts();

  const greeting = getTimeOfDayGreeting();
  const firstName = getDisplayFirstName(user);

  return (
    <div className="dashboard-page">
      <AppHeader />

      <WelcomeSection greeting={greeting} firstName={firstName} />

      <div className="dashboard-sections">
        {/* Follow-ups stay empty until real data is wired — avoids misleading sample names. */}
        <FollowUpsCard followUps={[]} />
        <DistrictListCard
          districts={districts}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
