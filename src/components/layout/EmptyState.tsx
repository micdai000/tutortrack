import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Icon } from "../ui/Icon";
import { cx } from "../ui/cx";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  /** panel = bordered surface; inline = nest inside an existing card */
  variant?: "panel" | "inline";
};

/** Shared empty-state pattern: icon, title, copy, optional action. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = "panel",
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        "tt-empty-state",
        variant === "inline" && "tt-empty-state--inline"
      )}
    >
      {icon && (
        <span className="tt-empty-state__icon" aria-hidden="true">
          <Icon icon={icon} size="md" tone="primary" />
        </span>
      )}
      <p className="tt-empty-state__title">{title}</p>
      {description && (
        <p className="tt-empty-state__description">{description}</p>
      )}
      {action}
    </div>
  );
}
