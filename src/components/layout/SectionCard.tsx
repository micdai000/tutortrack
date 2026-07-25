import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../ui/cx";

type SectionCardProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "article" | "div";
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  interactive?: boolean;
};

/** Standard surface card for page sections. */
export function SectionCard({
  as: Component = "section",
  title,
  description,
  actions,
  children,
  interactive = false,
  className,
  ...props
}: SectionCardProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <Component
      className={cx(
        "tt-section-card",
        interactive && "tt-section-card--interactive",
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div
          className={cx(
            "tt-section-card__header",
            actions ? "tt-section-card__header--with-actions" : undefined
          )}
        >
          <div className="tt-stack-sm">
            {title && <h2 className="tt-section-card__title">{title}</h2>}
            {description && (
              <p className="tt-section-card__description">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </Component>
  );
}
