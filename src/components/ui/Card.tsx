import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article";
  children: ReactNode;
  /** Soft border elevation on hover — for clickable/navigational cards. */
  interactive?: boolean;
  /** Remove default padding when composing custom inner layouts. */
  flush?: boolean;
};

/** Design-system surface card. */
export function Card({
  as: Component = "div",
  children,
  interactive = false,
  flush = false,
  className,
  ...props
}: CardProps) {
  return (
    <Component
      className={cx(
        "tt-card",
        interactive && "tt-card--interactive",
        flush && "tt-card--flush",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

type CardSectionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function CardHeader({ children, className, ...props }: CardSectionProps) {
  return (
    <div className={cx("tt-card__header", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...props }: CardSectionProps) {
  return (
    <div className={cx("tt-card__body", className)} {...props}>
      {children}
    </div>
  );
}
