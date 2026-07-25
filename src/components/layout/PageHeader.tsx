import type { ReactNode } from "react";

import { cx } from "../ui/cx";

type PageHeaderProps = {
  title: string;
  description?: string;
  kicker?: string;
  actions?: ReactNode;
  className?: string;
};

/** Consistent page title block used across workspace pages. */
export function PageHeader({
  title,
  description,
  kicker,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cx("tt-page-header", className)}>
      <div className={actions ? "tt-page-header__row" : undefined}>
        <div className="tt-stack-heading">
          {kicker && <p className="tt-page-header__kicker">{kicker}</p>}
          <h1 className="tt-page-header__title">{title}</h1>
          {description && (
            <p className="tt-page-header__description">{description}</p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}
