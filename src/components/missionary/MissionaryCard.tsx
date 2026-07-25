import type { ReactNode } from "react";

import { cx } from "../ui/cx";

type MissionaryCardDensity = "compact" | "medium" | "featured" | "meta";

type MissionaryCardProps = {
  children: ReactNode;
  density?: MissionaryCardDensity;
  /** Alias for density="featured". */
  featured?: boolean;
  className?: string;
};

/** Soft content card for one missionary profile section. */
export function MissionaryCard({
  children,
  density,
  featured = false,
  className,
}: MissionaryCardProps) {
  const resolvedDensity = density ?? (featured ? "featured" : "medium");

  return (
    <section
      className={cx(
        "missionary-card",
        `missionary-card--${resolvedDensity}`,
        className
      )}
    >
      {children}
    </section>
  );
}
