import type { SVGProps } from "react";

import { cx } from "../ui/cx";

type LogoMarkProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** When set, exposes an accessible name. Omit when paired with visible text. */
  title?: string;
};

/**
 * Official TutorTrack mark — open book with a T on each page.
 * Color inherits via `currentColor`.
 */
export function LogoMark({ className, title, ...props }: LogoMarkProps) {
  const labelled = Boolean(title);

  return (
    <svg
      className={cx("tt-logo-mark", className)}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      {...props}
    >
      {labelled ? <title>{title}</title> : null}

      {/* Left page */}
      <path
        d="
          M 24 11.4
          C 21.6 9.3 18.6 8.15 14.9 8.25
          C 9.6 8.55 6 10.9 6 14
          L 6 32.8
          C 6 36.15 9.7 38.85 15.1 39.25
          C 18.7 39.55 21.6 38.15 24 36.2
          Z
        "
        stroke="currentColor"
        strokeWidth="2.55"
        strokeLinejoin="round"
      />

      {/* Right page */}
      <path
        d="
          M 24 11.4
          C 26.4 9.3 29.4 8.15 33.1 8.25
          C 38.4 8.55 42 10.9 42 14
          L 42 32.8
          C 42 36.15 38.3 38.85 32.9 39.25
          C 29.3 39.55 26.4 38.15 24 36.2
          Z
        "
        stroke="currentColor"
        strokeWidth="2.55"
        strokeLinejoin="round"
      />

      {/* Left page T */}
      <path
        d="M 11.2 17.8 H 20.8 M 16 17.8 V 30"
        stroke="currentColor"
        strokeWidth="2.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right page T */}
      <path
        d="M 27.2 17.8 H 36.8 M 32 17.8 V 30"
        stroke="currentColor"
        strokeWidth="2.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
