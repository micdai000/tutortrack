type DistrictHeaderProps = {
  name: string;
};

/** Page header for a single district workspace. */
export function DistrictHeader({ name }: DistrictHeaderProps) {
  return (
    <header className="district-header">
      <h1 className="district-header__title">{name}</h1>
      <p className="district-header__subtitle">
        Manage companionships and quickly access each missionary&apos;s language
        plan.
      </p>
    </header>
  );
}
