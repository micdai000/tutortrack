import type { HTMLAttributes } from "react";

import { cx } from "../ui/cx";
import { LogoMark } from "./LogoMark";

export type LogoSize = "sm" | "nav" | "login" | "print";

const SIZE_PX: Record<LogoSize, number> = {
  sm: 16,
  nav: 28,
  login: 40,
  print: 24,
};

type LogoProps = HTMLAttributes<HTMLSpanElement> & {
  size?: LogoSize;
  /** Decorative when paired with visible text elsewhere. */
  decorative?: boolean;
};

/** Sized TutorTrack mark. Prefer `Brand` when wordmark is also needed. */
export function Logo({
  size = "nav",
  decorative = false,
  className,
  ...props
}: LogoProps) {
  const px = SIZE_PX[size];

  return (
    <span
      className={cx("tt-logo", `tt-logo--${size}`, className)}
      style={{ width: px, height: px }}
      {...props}
    >
      <LogoMark
        width={px}
        height={px}
        title={decorative ? undefined : "TutorTrack"}
      />
    </span>
  );
}

export { SIZE_PX as LOGO_SIZE_PX };
