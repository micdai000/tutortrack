import type { ReactNode } from "react";

type DistrictHeaderProps = {
  name: string;
  actions?: ReactNode;
};

/** Page header for a single district workspace. */
export function DistrictHeader({ name, actions }: DistrictHeaderProps) {
  return (
    <header className="district-header">
      <div className={actions ? "district-header__row" : undefined}>
        <div className="district-header__copy">
          <h1 className="district-header__title">{name}</h1>
          <p className="district-header__subtitle">
            Manage companionships and quickly access each missionary&apos;s
            language plan.
          </p>
        </div>
        {actions}
      </div>
    </header>
  );
}
