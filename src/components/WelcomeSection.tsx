type WelcomeSectionProps = {
  greeting: string;
  firstName: string;
};

export function WelcomeSection({ greeting, firstName }: WelcomeSectionProps) {
  return (
    <section className="dashboard-welcome">
      <h1>
        {greeting}, {firstName}
      </h1>
      <p>Here is what needs your attention today.</p>
    </section>
  );
}
