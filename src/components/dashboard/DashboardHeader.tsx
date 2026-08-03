type DashboardHeaderProps = {
  greeting: string;
  firstName: string;
};

/** Page header for the dashboard greeting. */
export function DashboardHeader({ greeting, firstName }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <h1 className="dashboard-header__title">
        {greeting}, {firstName}
      </h1>
      <p className="dashboard-header__subtitle">
        Review missionaries who need attention and manage active follow-ups.
      </p>
    </header>
  );
}
