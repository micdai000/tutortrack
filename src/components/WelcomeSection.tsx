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
      <p>Review follow-ups and jump into your districts.</p>
    </section>
  );
}
