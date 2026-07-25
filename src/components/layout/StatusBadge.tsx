import type { ReactNode } from "react";

import { cx } from "../ui/cx";

type StatusBadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
};

/** Compact status chip for shared UI language (autosave, labels, etc.). */
export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cx(
        "tt-status-badge",
        `tt-status-badge--${tone}`,
        className
      )}
    >
      {children}
    </span>
  );
}
