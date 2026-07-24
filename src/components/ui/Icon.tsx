import type { LucideIcon, LucideProps } from "lucide-react";

import { cx } from "./cx";

type IconSize = "sm" | "md" | "lg";
type IconTone = "default" | "muted" | "primary" | "selected";

type IconProps = Omit<LucideProps, "size" | "color"> & {
  icon: LucideIcon;
  size?: IconSize;
  tone?: IconTone;
  className?: string;
};

const STROKE_WIDTH = 1.75;

/**
 * Monochrome Lucide icon wrapper.
 * Keep icons outline-only; use tone="selected" | "primary" sparingly.
 */
export function Icon({
  icon: LucideGlyph,
  size = "md",
  tone = "default",
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: IconProps) {
  return (
    <span
      className={cx(
        "tt-icon",
        `tt-icon--${size}`,
        tone !== "default" && `tt-icon--${tone}`,
        className
      )}
      aria-hidden={ariaHidden}
    >
      <LucideGlyph strokeWidth={STROKE_WIDTH} {...props} />
    </span>
  );
}
