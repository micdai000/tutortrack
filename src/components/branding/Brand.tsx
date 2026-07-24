import type { HTMLAttributes } from "react";

import { cx } from "../ui/cx";
import { Logo, type LogoSize } from "./Logo";

type BrandTone = "primary" | "mono" | "inverse";

type BrandProps = HTMLAttributes<HTMLDivElement> & {
  /** Show wordmark beside the mark. */
  showWordmark?: boolean;
  /** Mark only — used when collapsed or favicon-like contexts. */
  logoOnly?: boolean;
  size?: LogoSize;
  tone?: BrandTone;
  align?: "start" | "center";
};

/**
 * Official TutorTrack brand lockup.
 * Supports mark-only or mark + “TutorTrack” wordmark at standard sizes.
 */
export function Brand({
  showWordmark = true,
  logoOnly = false,
  size = "nav",
  tone = "primary",
  align = "start",
  className,
  ...props
}: BrandProps) {
  const withWordmark = showWordmark && !logoOnly;

  return (
    <div
      className={cx(
        "tt-brand",
        `tt-brand--${size}`,
        `tt-brand--${tone}`,
        align === "center" && "tt-brand--center",
        className
      )}
      aria-label="TutorTrack"
      {...props}
    >
      <Logo size={size} decorative={withWordmark} />
      {withWordmark && <span className="tt-brand__wordmark">TutorTrack</span>}
    </div>
  );
}
